package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;
import com.resumeanalyzer.backend.service.LLMAnalysisService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LLMAnalysisServiceImpl implements LLMAnalysisService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${groq.api.key:}")
    private String groqApiKey;
    
    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;
    
    @Value("${llm.enabled:false}")
    private boolean llmEnabled;
    
    // Fallback to free Ollama if Groq is not available
    @Value("${ollama.api.url:http://localhost:11434/api/generate}")
    private String ollamaApiUrl;
    
    @Override
    public boolean isLLMAvailable() {
        return llmEnabled && (!groqApiKey.isEmpty() || isOllamaAvailable());
    }
    
    private boolean isOllamaAvailable() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> testRequest = Map.of(
                "model", "llama3.2",
                "prompt", "test",
                "stream", false
            );
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(testRequest, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                ollamaApiUrl, HttpMethod.POST, entity, String.class);
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
    
    @Override
    public CandidateAnalysisDTO enhanceAnalysisWithLLM(String resumeText, String jobDescription) {
        if (!isLLMAvailable()) {
            throw new RuntimeException("LLM service is not available");
        }
        
        String prompt = buildJobMatchPrompt(resumeText, jobDescription);
        String llmResponse = callLLM(prompt);
        
        return parseEnhancedAnalysis(llmResponse, resumeText, jobDescription);
    }
    
    @Override
    public CandidateAnalysisDTO analyzeResumeWithLLM(String resumeText) {
        if (!isLLMAvailable()) {
            throw new RuntimeException("LLM service is not available");
        }
        
        String prompt = buildResumeAnalysisPrompt(resumeText);
        String llmResponse = callLLM(prompt);
        
        return parseResumeAnalysis(llmResponse, resumeText);
    }
    
    @Override
    public String extractCandidateNameWithLLM(String resumeText) {
        if (!isLLMAvailable()) {
            return extractNameFallback(resumeText);
        }
        
        String prompt = buildNameExtractionPrompt(resumeText);
        String llmResponse = callLLM(prompt);
        
        return parseNameFromResponse(llmResponse);
    }
    
    private String callLLM(String prompt) {
        try {
            if (!groqApiKey.isEmpty()) {
                return callGroqAPI(prompt);
            } else if (isOllamaAvailable()) {
                return callOllamaAPI(prompt);
            } else {
                throw new RuntimeException("No LLM service available");
            }
        } catch (Exception e) {
            System.err.println("LLM API call failed: " + e.getMessage());
            throw new RuntimeException("Failed to call LLM service", e);
        }
    }
    
    private String callGroqAPI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);
        
        Map<String, Object> message = Map.of(
            "role", "user",
            "content", prompt
        );
        
        Map<String, Object> requestBody = Map.of(
            "model", "llama-3.1-8b-instant", // Fast and free model
            "messages", List.of(message),
            "max_tokens", 1024,
            "temperature", 0.1,
            "response_format", Map.of("type", "json_object") // Force JSON output
        );
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(
            groqApiUrl, HttpMethod.POST, entity, String.class);
        
        JsonNode responseJson = objectMapper.readTree(response.getBody());
        return responseJson.path("choices").get(0).path("message").path("content").asText();
    }
    
    private String callOllamaAPI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> requestBody = Map.of(
            "model", "llama3.2", // Free local model
            "prompt", prompt,
            "stream", false,
            "options", Map.of("temperature", 0.1, "num_predict", 1024)
        );
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(
            ollamaApiUrl, HttpMethod.POST, entity, String.class);
        
        JsonNode responseJson = objectMapper.readTree(response.getBody());
        return responseJson.path("response").asText();
    }
    
    private String buildJobMatchPrompt(String resumeText, String jobDescription) {
        return String.format("""
            You are an expert ATS resume analyzer. Analyze this resume against the job description and provide accurate, differentiated scoring.
            
            IMPORTANT: Respond ONLY with valid JSON. No explanations, no text before or after the JSON.
            
            SCORING CRITERIA (Calculate scores based on actual match quality):
            
            SKILLS SCORE (0.0-1.0):
            - 0.9-1.0: 90%+ required skills present, advanced expertise evident
            - 0.7-0.8: 70-89%% required skills present, good proficiency
            - 0.5-0.6: 50-69%% required skills present, basic knowledge
            - 0.3-0.4: 30-49%% required skills present, significant gaps
            - 0.0-0.2: <30%% required skills present, poor match
            
            EXPERIENCE SCORE (0.0-1.0):
            - 1.0: Exceeds required experience significantly
            - 0.8-0.9: Meets/slightly exceeds required experience
            - 0.6-0.7: Close to required experience (within 1-2 years)
            - 0.4-0.5: Some relevant experience but below requirements
            - 0.2-0.3: Limited relevant experience
            - 0.0-0.1: No relevant professional experience
            
            PROJECTS SCORE (0.0-1.0):
            - 0.9-1.0: Multiple relevant projects with technologies mentioned in JD
            - 0.7-0.8: Some relevant projects with partial tech match
            - 0.5-0.6: General projects, limited relevance to role
            - 0.3-0.4: Few projects, minimal relevance
            - 0.0-0.2: No relevant projects
            
            EDUCATION SCORE (0.0-1.0):
            - 1.0: Exceeds education requirements (advanced degree when preferred)
            - 0.8: Meets education requirements exactly
            - 0.6: Related field, acceptable level
            - 0.4: Different field but acceptable level
            - 0.2: Below requirements but some education
            - 0.0: No relevant education
            
            OVERALL SCORE: Weighted average (Skills: 40%%, Experience: 35%%, Projects: 15%%, Education: 10%%)
            
            EXPERIENCE CALCULATION RULES (STRICTLY FOLLOW - ZERO TOLERANCE):
            - Count ONLY professional work experience, internship jobs, or paid employment with clear company names
            - Do NOT count academic projects, college projects, or university assignments as work experience
            - Do NOT count educational duration (college years) as work experience
            - If resume shows "MCA 2024-2026" or similar future dates = CURRENT STUDENT = 0 years experience
            - If candidate mentions "pursuing", "currently studying", "final year", "student" = 0 years experience
            - Look for specific job titles like "Software Engineer at ABC Company", "Developer at XYZ Corp"
            - Look for company names and employment periods with start/end dates: "Worked at Google 2022-2024"
            - If resume only shows education (Bachelor's, Master's) without clear job history = 0 years
            - If resume only mentions "projects" without job titles/companies = 0 years
            - If candidate is described as "fresher", "recent graduate", "student" = 0 years
            - Academic projects like "E-commerce website", "Chat application" are NOT work experience
            - Personal projects, college projects, university assignments = NOT work experience
            - Only count if there are clear employment indicators: "worked at", "employed by", "position at", "job at"
            - Internships count ONLY if they mention company names and were paid positions
            - If no clear work experience found, MUST set to 0 years
            - If no work experience found, set to 0 years
            
            EXPERIENCE LEVEL GUIDELINES:
            - "Fresher": 0 years professional experience, recent graduate
            - "Student": Currently studying (especially with future graduation dates like 2025-2026), 0 years professional experience
            - "Entry Level": 0-1 years professional experience
            - "Junior": 1-3 years professional experience
            - "Mid-Level": 3-6 years professional experience
            - "Senior": 6+ years with leadership/mentoring
            - "Lead/Principal": 8+ years with team management
            
            IMPORTANT: If you see education dates extending into the future (like 2024-2026), this indicates a CURRENT STUDENT.
            Set totalYearsExperience to 0 and experienceLevel to "Student".
            
            CRITICAL STUDENT DETECTION:
            - "MCA 2024-2026" = Current student, 0 years experience
            - "BCA 2021-2024, MCA 2024-2026" = Current student, 0 years experience  
            - Any graduation date in 2025 or later = Current student, 0 years experience
            - Phrases like "pursuing MCA", "final year student" = 0 years experience
            
            RESUME:
            %s
            
            JOB DESCRIPTION:
            %s
            
            Analyze carefully and provide realistic scores. Most candidates should score between 0.3-0.8 overall.
            
            CRITICAL: If you cannot find clear work experience indicators, set totalYearsExperience to 0 and experienceLevel to "Fresher".
            Do not guess or assume experience that is not explicitly mentioned.
            
            JSON Response Format:
            {
                "overallScore": [calculated_weighted_average],
                "skillsScore": [skills_match_percentage],
                "experienceScore": [experience_relevance_score],
                "educationScore": [education_match_score],
                "projectsScore": [projects_relevance_score],
                "experienceLevel": "[level_based_on_years]",
                "totalYearsExperience": [actual_years_number],
                "skills": ["specific_skill1", "specific_skill2", "framework1", "language1"],
                "matchedSkills": ["matched_skill1", "matched_skill2"],
                "missingSkills": ["missing_skill1", "missing_skill2"],
                "projects": ["Complete Project Name 1 - Brief description", "Complete Project Name 2 - Brief description"],
                "education": ["MCA - Master of Computer Applications", "BCA - Bachelor of Computer Applications"],
                "candidateStrength": "specific detailed strength based on analysis (2-3 sentences with concrete examples)",
                "candidateWeakness": "specific detailed weakness based on analysis (2-3 sentences with areas for improvement)",
                "fitAssessment": "detailed role fit assessment (3-4 sentences explaining suitability, gaps, and potential)",
                "improvementSuggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2", "specific actionable suggestion 3"]
            }
            
            IMPORTANT EXTRACTION RULES:
            - For skills: Extract specific technologies, languages, frameworks (not generic terms)
            - For projects: Extract actual project names and descriptions (not section headers like "Projects & Achievements")
            - For education: Extract ONLY course/degree names like "MCA - Master of Computer Applications", "BCA - Bachelor of Computer Applications"
              Do NOT include institution names, years, locations, or section headers
              Example: ["MCA - Master of Computer Applications", "BCA - Bachelor of Computer Applications"]
            - Provide detailed, specific responses (not generic placeholders)
            """, truncateText(resumeText, 3000), truncateText(jobDescription, 1500));
    }
    
    private String buildResumeAnalysisPrompt(String resumeText) {
        return String.format("""
            You are an expert ATS resume analyzer. Analyze this resume and provide accurate, differentiated scoring.
            
            IMPORTANT: Respond ONLY with valid JSON. No explanations, no text before or after the JSON.
            
            SCORING CRITERIA (Be realistic and differentiate between candidates):
            
            SKILLS SCORE (0.0-1.0):
            - 0.9-1.0: Advanced expertise in multiple technologies, depth and breadth
            - 0.7-0.8: Strong technical skills with good breadth
            - 0.5-0.6: Decent technical foundation, some specialization
            - 0.3-0.4: Basic technical skills, limited scope
            - 0.0-0.2: Minimal or unclear technical skills
            
            EXPERIENCE SCORE (0.0-1.0):
            - 1.0: 8+ years with senior responsibilities
            - 0.8-0.9: 5-8 years with solid track record
            - 0.6-0.7: 2-5 years with relevant experience
            - 0.4-0.5: 0-2 years or internships
            - 0.2-0.3: No professional experience but some internships
            - 0.0-0.1: No professional experience, fresher/student
            
            PROJECTS SCORE (0.0-1.0):
            - 0.9-1.0: Multiple complex projects with advanced technologies
            - 0.7-0.8: Several good projects with modern tech stack
            - 0.5-0.6: Some decent projects with basic technologies
            - 0.3-0.4: Few simple projects
            - 0.0-0.2: Minimal or no projects mentioned
            
            EDUCATION SCORE (0.0-1.0):
            - 1.0: Advanced degree (Masters/PhD) in relevant field
            - 0.8: Bachelor's in directly relevant field (CS, Engineering)
            - 0.6: Bachelor's in related field
            - 0.4: Bachelor's in different field
            - 0.2: Some college or certifications
            - 0.0: No formal education mentioned
            
            OVERALL SCORE: Weighted average (Skills: 35%%, Experience: 40%%, Projects: 15%%, Education: 10%%)
            
            EXPERIENCE CALCULATION RULES (STRICTLY FOLLOW - ZERO TOLERANCE):
            - Count ONLY professional work experience, internship jobs, or paid employment with clear company names
            - Do NOT count academic projects, college projects, or university assignments as work experience
            - Do NOT count educational duration (college years) as work experience
            - If resume shows "MCA 2024-2026" or similar future dates = CURRENT STUDENT = 0 years experience
            - If candidate mentions "pursuing", "currently studying", "final year", "student" = 0 years experience
            - Look for specific job titles like "Software Engineer at ABC Company", "Developer at XYZ Corp"
            - Look for company names and employment periods with start/end dates: "Worked at Google 2022-2024"
            - If resume only shows education (Bachelor's, Master's) without clear job history = 0 years
            - If resume only mentions "projects" without job titles/companies = 0 years
            - If candidate is described as "fresher", "recent graduate", "student" = 0 years
            - Academic projects like "E-commerce website", "Chat application" are NOT work experience
            - Personal projects, college projects, university assignments = NOT work experience
            - Only count if there are clear employment indicators: "worked at", "employed by", "position at", "job at"
            - Internships count ONLY if they mention company names and were paid positions
            - If no clear work experience found, MUST set to 0 years
            - Only count if there are clear employment indicators: "worked at", "employed by", "position at"
            - If no work experience found, set to 0 years
            
            EXPERIENCE LEVEL GUIDELINES:
            - "Fresher": 0 years professional experience
            - "Student": Currently studying, 0 years professional experience  
            - "Entry Level": 0-1 years professional experience
            - "Junior": 1-3 years professional experience
            - "Mid-Level": 3-6 years professional experience
            - "Senior": 6+ years with leadership/mentoring
            - "Lead/Principal": 8+ years with team management
            
            RESUME:
            %s
            
            Analyze carefully and provide realistic scores. Differentiate between candidates based on their actual qualifications.
            Most resumes should score between 0.2-0.8 overall, not everyone is excellent.
            
            CRITICAL: If you cannot find clear work experience indicators, set totalYearsExperience to 0 and experienceLevel to "Fresher".
            Do not guess or assume experience that is not explicitly mentioned.
            
            JSON Response Format:
            {
                "overallScore": [calculated_weighted_average],
                "skillsScore": [skills_assessment_score],
                "experienceScore": [experience_relevance_score],
                "educationScore": [education_level_score],
                "projectsScore": [projects_quality_score],
                "experienceLevel": "[level_based_on_years]",
                "totalYearsExperience": [actual_years_number],
                "skills": ["specific_skill1", "specific_skill2", "framework1", "language1"],
                "projects": ["Complete Project Name 1 - Brief description", "Complete Project Name 2 - Brief description"],
                "education": ["MCA - Master of Computer Applications", "BCA - Bachelor of Computer Applications"],
                "candidateStrength": "specific detailed strength based on analysis (2-3 sentences with concrete examples)",
                "candidateWeakness": "specific detailed weakness based on analysis (2-3 sentences with areas for improvement)",
                "improvementSuggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2", "specific actionable suggestion 3"]
            }
            
            IMPORTANT EXTRACTION RULES:
            - For skills: Extract specific technologies, languages, frameworks (not generic terms like "Programming")
            - For projects: Extract actual project names and descriptions (not section headers like "Projects & Achievements")
            - For education: Extract each degree, institution, and year as separate array items
              Example: ["MCA - Master of Computer Applications", "BCA - Bachelor of Computer Applications"]
              Do NOT include section headers like "Education & Qualifications"
            - Provide detailed, specific responses with concrete examples
            - Avoid generic placeholders - be specific about what you find in the resume
            """, truncateText(resumeText, 4000));
    }
    
    private String buildNameExtractionPrompt(String resumeText) {
        return String.format("""
            Extract the candidate's full name from this resume. Return only the name, nothing else.
            
            RESUME:
            %s
            
            Return only the candidate's name in format: "FirstName LastName"
            If no clear name is found, return "Unknown Candidate"
            """, truncateText(resumeText, 1000));
    }
    
    private String truncateText(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    }
    
    private CandidateAnalysisDTO parseEnhancedAnalysis(String llmResponse, String resumeText, String jobDescription) {
        try {
            // Clean the response to extract JSON
            String cleanedResponse = extractJsonFromResponse(llmResponse);
            JsonNode analysisJson = objectMapper.readTree(cleanedResponse);
            
            // Calculate dynamic fallback scores based on resume content to avoid same scores
            double baseFallback = calculateFallbackScore(resumeText);
            
            return CandidateAnalysisDTO.builder()
                .overallScore(getDoubleValue(analysisJson, "overallScore", baseFallback))
                .skillsScore(getDoubleValue(analysisJson, "skillsScore", baseFallback + 0.05))
                .experienceScore(getDoubleValue(analysisJson, "experienceScore", baseFallback - 0.1))
                .educationScore(getDoubleValue(analysisJson, "educationScore", baseFallback + 0.1))
                .projectsScore(getDoubleValue(analysisJson, "projectsScore", baseFallback))
                .experienceLevel(analysisJson.path("experienceLevel").asText("Entry Level"))
                .totalYearsExperience(getIntValue(analysisJson, "totalYearsExperience", 0))
                .skills(parseStringArray(analysisJson.path("skills")))
                .matchedSkills(parseStringArray(analysisJson.path("matchedSkills")))
                .missingSkills(parseStringArray(analysisJson.path("missingSkills")))
                .projects(parseStringArray(analysisJson.path("projects")))
                .education(parseStringArray(analysisJson.path("education")))
                .candidateStrength(analysisJson.path("candidateStrength").asText("Mixed qualifications"))
                .candidateWeakness(analysisJson.path("candidateWeakness").asText("Analysis incomplete"))
                .fitAssessment(analysisJson.path("fitAssessment").asText("Requires further evaluation"))
                .improvementSuggestions(parseStringArray(analysisJson.path("improvementSuggestions")))
                .skillCategoryScores(Map.of())
                .skillCategoryCounts(Map.of())
                .hasJD(true)
                .extractedSkills(String.join(", ", parseStringArray(analysisJson.path("skills"))))
                .extractedExperience(truncateText(resumeText, 500))
                .extractedProjects(String.join(", ", parseStringArray(analysisJson.path("projects"))))
                .extractedEducation(String.join(", ", parseStringArray(analysisJson.path("education"))))
                .extractedCertifications("")
                .hackathons(List.of())
                .suggestions(parseStringArray(analysisJson.path("improvementSuggestions")))
                .experienceHighlights(List.of("Experience: " + analysisJson.path("totalYearsExperience").asInt(0) + " years"))
                .projectHighlights(parseStringArray(analysisJson.path("projects")))
                .educationHighlights(parseStringArray(analysisJson.path("education")))
                .certificationHighlights(List.of())
                .resumeTips(List.of())
                .learningRecommendations(parseStringArray(analysisJson.path("improvementSuggestions")))
                .build();
            
        } catch (Exception e) {
            System.err.println("Failed to parse LLM response: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            System.err.println("LLM Response length: " + llmResponse.length());
            System.err.println("LLM Response preview: " + (llmResponse.length() > 200 ? llmResponse.substring(0, 200) + "..." : llmResponse));
            e.printStackTrace();
            return createFallbackAnalysis(resumeText, true);
        }
    }
    
    private CandidateAnalysisDTO parseResumeAnalysis(String llmResponse, String resumeText) {
        try {
            // Clean the response to extract JSON
            String cleanedResponse = extractJsonFromResponse(llmResponse);
            JsonNode analysisJson = objectMapper.readTree(cleanedResponse);
            
            // Calculate dynamic fallback scores based on resume content to avoid same scores
            double baseFallback = calculateFallbackScore(resumeText);
            
            return CandidateAnalysisDTO.builder()
                .overallScore(getDoubleValue(analysisJson, "overallScore", baseFallback))
                .skillsScore(getDoubleValue(analysisJson, "skillsScore", baseFallback + 0.1))
                .experienceScore(getDoubleValue(analysisJson, "experienceScore", baseFallback - 0.15))
                .educationScore(getDoubleValue(analysisJson, "educationScore", baseFallback + 0.05))
                .projectsScore(getDoubleValue(analysisJson, "projectsScore", baseFallback - 0.05))
                .experienceLevel(analysisJson.path("experienceLevel").asText("Entry Level"))
                .totalYearsExperience(getIntValue(analysisJson, "totalYearsExperience", 0))
                .skills(parseStringArray(analysisJson.path("skills")))
                .matchedSkills(List.of()) // Initialize as empty list
                .missingSkills(List.of()) // Initialize as empty list
                .projects(parseStringArray(analysisJson.path("projects")))
                .education(parseStringArray(analysisJson.path("education")))
                .candidateStrength(analysisJson.path("candidateStrength").asText("Basic qualifications"))
                .candidateWeakness(analysisJson.path("candidateWeakness").asText("Analysis needs completion"))
                .improvementSuggestions(parseStringArray(analysisJson.path("improvementSuggestions")))
                .skillCategoryScores(Map.of())
                .skillCategoryCounts(Map.of())
                .hasJD(false)
                .extractedSkills(String.join(", ", parseStringArray(analysisJson.path("skills"))))
                .extractedExperience(truncateText(resumeText, 500))
                .extractedProjects(String.join(", ", parseStringArray(analysisJson.path("projects"))))
                .extractedEducation(String.join(", ", parseStringArray(analysisJson.path("education"))))
                .extractedCertifications("")
                .hackathons(List.of())
                .suggestions(parseStringArray(analysisJson.path("improvementSuggestions")))
                .experienceHighlights(List.of("Experience: " + analysisJson.path("totalYearsExperience").asInt(0) + " years"))
                .projectHighlights(parseStringArray(analysisJson.path("projects")))
                .educationHighlights(parseStringArray(analysisJson.path("education")))
                .certificationHighlights(List.of())
                .resumeTips(List.of())
                .learningRecommendations(parseStringArray(analysisJson.path("improvementSuggestions")))
                .fitAssessment("General candidate assessment")
                .build();
            
        } catch (Exception e) {
            System.err.println("Failed to parse LLM response: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            System.err.println("LLM Response length: " + llmResponse.length());  
            System.err.println("LLM Response preview: " + (llmResponse.length() > 200 ? llmResponse.substring(0, 200) + "..." : llmResponse));
            e.printStackTrace();
            return createFallbackAnalysis(resumeText, false);
        }
    }
    
    private String extractJsonFromResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            System.err.println("Empty or null LLM response");
            return "{}";
        }
        
        // Try to find JSON within the response
        int jsonStart = response.indexOf('{');
        int jsonEnd = response.lastIndexOf('}');
        
        if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
            String jsonStr = response.substring(jsonStart, jsonEnd + 1);
            System.out.println("Extracted JSON length: " + jsonStr.length());
            return jsonStr;
        }
        
        // If no JSON brackets found, log the issue and return empty JSON
        System.err.println("No valid JSON found in LLM response");
        System.err.println("Response starts with: " + (response.length() > 50 ? response.substring(0, 50) + "..." : response));
        return "{}";
    }
    
    private String parseNameFromResponse(String llmResponse) {
        // Clean up the response and extract name
        String cleanResponse = llmResponse.trim().replaceAll("\"", "");
        
        // Basic validation
        if (cleanResponse.length() > 50 || cleanResponse.contains("\n")) {
            return extractNameFallback(cleanResponse);
        }
        
        // Check if it looks like a name
        if (cleanResponse.matches("^[A-Z][a-z]+ [A-Z][a-z]+.*")) {
            return cleanResponse.split(" ")[0] + " " + cleanResponse.split(" ")[1];
        }
        
        return extractNameFallback(cleanResponse);
    }
    
    private String extractNameFallback(String text) {
        // Fallback name extraction logic
        String[] lines = text.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.length() > 5 && line.length() < 50 && line.matches(".*[A-Z][a-z]+ [A-Z][a-z]+.*")) {
                return line;
            }
        }
        return "Unknown Candidate";
    }
    
    private List<String> parseStringArray(JsonNode arrayNode) {
        List<String> result = new ArrayList<>();
        if (arrayNode.isArray()) {
            for (JsonNode item : arrayNode) {
                result.add(item.asText());
            }
        }
        return result;
    }
    
    private CandidateAnalysisDTO createFallbackAnalysis(String resumeText, boolean hasJD) {
        // Create a basic analysis when LLM parsing fails - use rule-based fallback
        int fallbackYears = extractBasicYearsFromText(resumeText);
        String fallbackLevel = fallbackYears == 0 ? "Fresher" : 
                              fallbackYears <= 1 ? "Entry Level" :
                              fallbackYears <= 3 ? "Junior" : "Mid-level";
        
        return CandidateAnalysisDTO.builder()
            .overallScore(calculateFallbackScore(resumeText))
            .skillsScore(calculateFallbackScore(resumeText) + 0.05)
            .experienceScore(fallbackYears == 0 ? 0.1 : calculateFallbackScore(resumeText))
            .educationScore(calculateFallbackScore(resumeText) + 0.1)
            .projectsScore(calculateFallbackScore(resumeText))
            .experienceLevel(fallbackLevel)
            .totalYearsExperience(fallbackYears)
            .skills(extractBasicSkillsFromText(resumeText))
            .matchedSkills(hasJD ? extractBasicSkillsFromText(resumeText).subList(0, Math.min(2, extractBasicSkillsFromText(resumeText).size())) : List.of())
            .missingSkills(hasJD ? List.of("Advanced Skills", "Specific Technologies") : List.of())
            .projects(extractBasicProjectsFromText(resumeText))
            .education(extractBasicEducationFromText(resumeText))
            .candidateStrength(generateBasicStrength(resumeText))
            .candidateWeakness(generateBasicWeakness(resumeText, fallbackYears))
            .improvementSuggestions(generateBasicSuggestions(fallbackYears))
            .skillCategoryScores(Map.of())
            .skillCategoryCounts(Map.of())
            .hasJD(hasJD)
            .extractedSkills(String.join(", ", extractBasicSkillsFromText(resumeText)))
            .extractedExperience("Work experience")
            .extractedProjects("Projects")
            .extractedEducation("Education")
            .extractedCertifications("")
            .hackathons(List.of())
            .suggestions(List.of("Improve skills"))
            .experienceHighlights(List.of("Experience: 2 years"))
            .projectHighlights(List.of("Projects"))
            .educationHighlights(List.of("Education"))
            .certificationHighlights(List.of())
            .resumeTips(List.of())
            .learningRecommendations(List.of())
            .fitAssessment(hasJD ? "Analysis completed" : "General assessment")
            .build();
    }
    
    // Helper method to calculate fallback scores based on resume content
    private double calculateFallbackScore(String resumeText) {
        String lowerText = resumeText.toLowerCase();
        double score = 0.3; // Base score
        
        // Add score based on content indicators
        if (lowerText.contains("experience") || lowerText.contains("worked")) score += 0.1;
        if (lowerText.contains("project") || lowerText.contains("developed")) score += 0.1;
        if (lowerText.contains("bachelor") || lowerText.contains("master") || lowerText.contains("degree")) score += 0.05;
        if (lowerText.contains("java") || lowerText.contains("python") || lowerText.contains("javascript")) score += 0.05;
        if (lowerText.contains("senior") || lowerText.contains("lead") || lowerText.contains("manager")) score += 0.1;
        
        // Add some variance based on resume length to avoid identical scores
        int lengthVariance = (resumeText.length() % 100) / 100; // Small variance based on length
        score += lengthVariance * 0.05;
        
        return Math.min(0.8, Math.max(0.2, score)); // Ensure score is between 0.2 and 0.8
    }
    
    // Helper methods for fallback analysis when LLM fails
    private int extractBasicYearsFromText(String resumeText) {
        String lowerText = resumeText.toLowerCase();
        
        // Safety check for freshers
        if (lowerText.contains("fresher") || lowerText.contains("no experience") || 
            lowerText.contains("recent graduate") || lowerText.contains("seeking first job")) {
            return 0;
        }
        
        // Look for explicit year mentions
        Pattern yearsPattern = Pattern.compile("(\\d+)\\s*\\+?\\s*years?.*?(experience|work)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = yearsPattern.matcher(resumeText);
        
        while (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException e) {
                // Continue looking
            }
        }
        
        // Look for job titles with dates
        Pattern jobPattern = Pattern.compile("(software engineer|developer|analyst|programmer).*?(20\\d{2})\\s*[-–]\\s*(20\\d{2}|present)", Pattern.CASE_INSENSITIVE);
        Matcher jobMatcher = jobPattern.matcher(resumeText);
        
        if (jobMatcher.find()) {
            try {
                int startYear = Integer.parseInt(jobMatcher.group(2));
                int endYear = jobMatcher.group(3).toLowerCase().contains("present") ? 
                             Calendar.getInstance().get(Calendar.YEAR) : 
                             Integer.parseInt(jobMatcher.group(3));
                return Math.max(0, endYear - startYear);
            } catch (NumberFormatException e) {
                // Fall through
            }
        }
        
        return 0; // Default to 0 for safety
    }
    
    private List<String> extractBasicSkillsFromText(String resumeText) {
        List<String> skills = new ArrayList<>();
        String lowerText = resumeText.toLowerCase();
        
        // Common programming languages
        if (lowerText.contains("java")) skills.add("Java");
        if (lowerText.contains("python")) skills.add("Python");
        if (lowerText.contains("javascript")) skills.add("JavaScript");
        if (lowerText.contains("react")) skills.add("React");
        if (lowerText.contains("spring")) skills.add("Spring");
        if (lowerText.contains("node")) skills.add("Node.js");
        if (lowerText.contains("sql")) skills.add("SQL");
        if (lowerText.contains("html")) skills.add("HTML");
        if (lowerText.contains("css")) skills.add("CSS");
        if (lowerText.contains("git")) skills.add("Git");
        
        return skills.isEmpty() ? List.of("Programming") : skills;
    }
    
    private List<String> extractBasicProjectsFromText(String resumeText) {
        List<String> projects = new ArrayList<>();
        String[] lines = resumeText.split("\\n");
        
        for (String line : lines) {
            String trimmed = line.trim();
            // Look for project-like lines (not too short, not too long, contains project indicators)
            if (trimmed.length() > 15 && trimmed.length() < 150 && 
                (trimmed.toLowerCase().contains("project") || 
                 trimmed.toLowerCase().contains("developed") ||
                 trimmed.toLowerCase().contains("built") ||
                 trimmed.toLowerCase().contains("created")) &&
                !trimmed.toLowerCase().contains("projects") && // Skip section headers
                !trimmed.toLowerCase().contains("achievements")) { // Skip section headers
                projects.add(trimmed);
                if (projects.size() >= 5) break; // Limit to avoid too many
            }
        }
        
        return projects.isEmpty() ? List.of("Academic Projects") : projects;
    }
    
    private List<String> extractBasicEducationFromText(String resumeText) {
        List<String> education = new ArrayList<>();
        String[] lines = resumeText.split("\\n");
        
        for (String line : lines) {
            String trimmed = line.trim();
            // Remove bullet points, dashes, and clean up
            trimmed = trimmed.replaceAll("^[•\\-\\*\\+]\\s*", "").trim();
            
            // Look for degree patterns only - extract course names
            if (trimmed.length() > 5 && trimmed.length() < 100) {
                String lowerLine = trimmed.toLowerCase();
                
                // Extract degree course names specifically
                if (lowerLine.contains("mca") && !education.contains("MCA")) {
                    education.add("MCA - Master of Computer Applications");
                }
                else if (lowerLine.contains("bca") && !education.contains("BCA")) {
                    education.add("BCA - Bachelor of Computer Applications");
                }
                else if (lowerLine.contains("b.tech") || lowerLine.contains("btech")) {
                    if (lowerLine.contains("computer science")) {
                        education.add("B.Tech Computer Science");
                    } else {
                        education.add("B.Tech Engineering");
                    }
                }
                else if (lowerLine.contains("bachelor") && lowerLine.contains("computer")) {
                    education.add("Bachelor of Computer Science");
                }
                else if (lowerLine.contains("master") && lowerLine.contains("computer")) {
                    education.add("Master of Computer Science");
                }
                else if (lowerLine.contains("mba")) {
                    education.add("MBA - Master of Business Administration");
                }
                
                // Skip institution names, years, and other details
                // Only keep course names
            }
        }
        
        // Remove duplicates and limit to course names only
        return education.isEmpty() ? List.of("Degree") : 
               education.stream().distinct().limit(3).collect(Collectors.toList());
    }
    
    private String generateBasicStrength(String resumeText) {
        String lowerText = resumeText.toLowerCase();
        List<String> strengths = new ArrayList<>();
        
        if (lowerText.contains("java") && lowerText.contains("spring")) {
            strengths.add("Strong proficiency in Java and Spring framework development");
        }
        if (lowerText.contains("react") && lowerText.contains("javascript")) {
            strengths.add("Solid frontend development skills with React and modern JavaScript");
        }
        if (lowerText.contains("python") && lowerText.contains("django")) {
            strengths.add("Python web development expertise with Django framework");
        }
        if (lowerText.contains("database") || lowerText.contains("sql")) {
            strengths.add("Database management and SQL querying capabilities");
        }
        if (lowerText.contains("project") && lowerText.contains("developed")) {
            strengths.add("Hands-on project development experience with practical implementation skills");
        }
        if (lowerText.contains("api") || lowerText.contains("rest")) {
            strengths.add("API development and integration experience");
        }
        
        if (strengths.isEmpty()) {
            return "Technical background with programming skills and ability to learn new technologies quickly.";
        }
        
        return String.join(". ", strengths.subList(0, Math.min(2, strengths.size()))) + 
               ". Shows good technical foundation for software development roles.";
    }
    
    private String generateBasicWeakness(String resumeText, int years) {
        List<String> weaknesses = new ArrayList<>();
        
        if (years == 0) {
            weaknesses.add("Limited professional work experience in industry settings");
            weaknesses.add("Needs exposure to enterprise-level software development practices");
            weaknesses.add("Requires guidance on production-level code quality and deployment processes");
        } else if (years <= 1) {
            weaknesses.add("Early career stage requiring mentorship for complex problem-solving");
            weaknesses.add("Limited experience with large-scale application architecture");
        } else if (years <= 3) {
            weaknesses.add("Could benefit from exposure to system design and scalability challenges");
            weaknesses.add("May need development in leadership and cross-functional collaboration");
        } else {
            weaknesses.add("Could enhance skills in emerging technologies and modern development practices");
        }
        
        return String.join(". ", weaknesses.subList(0, Math.min(2, weaknesses.size()))) + 
               ". These areas can be addressed through targeted learning and practical experience.";
    }
    
    private List<String> generateBasicSuggestions(int years) {
        List<String> suggestions = new ArrayList<>();
        
        if (years == 0) {
            suggestions.add("Gain professional work experience through internships or entry-level positions");
            suggestions.add("Build a strong portfolio with real-world projects");
            suggestions.add("Learn industry-standard tools and practices");
        } else if (years <= 2) {
            suggestions.add("Focus on deepening technical expertise in chosen stack");
            suggestions.add("Take on more complex projects with larger scope");
            suggestions.add("Learn system design and architecture principles");
        } else {
            suggestions.add("Develop leadership and mentoring skills");
            suggestions.add("Gain experience with enterprise-scale applications");
            suggestions.add("Consider specializing in emerging technologies");
        }
        
        return suggestions;
    }
    
    // Helper methods for safe JSON value extraction
    private double getDoubleValue(JsonNode node, String fieldName, double defaultValue) {
        try {
            JsonNode fieldNode = node.path(fieldName);
            if (fieldNode.isMissingNode() || fieldNode.isNull()) {
                return defaultValue;
            }
            if (fieldNode.isTextual()) {
                // Try to parse text as double
                String textValue = fieldNode.asText().trim();
                if (textValue.isEmpty()) return defaultValue;
                return Double.parseDouble(textValue);
            }
            return fieldNode.asDouble(defaultValue);
        } catch (Exception e) {
            System.err.println("Error parsing double field '" + fieldName + "': " + e.getMessage());
            return defaultValue;
        }
    }
    
    private int getIntValue(JsonNode node, String fieldName, int defaultValue) {
        try {
            JsonNode fieldNode = node.path(fieldName);
            if (fieldNode.isMissingNode() || fieldNode.isNull()) {
                return defaultValue;
            }
            if (fieldNode.isTextual()) {
                // Try to parse text as int
                String textValue = fieldNode.asText().trim();
                if (textValue.isEmpty()) return defaultValue;
                return Integer.parseInt(textValue);
            }
            return fieldNode.asInt(defaultValue);
        } catch (Exception e) {
            System.err.println("Error parsing int field '" + fieldName + "': " + e.getMessage());
            return defaultValue;
        }
    }
}
