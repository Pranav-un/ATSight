package com.resumeanalyzer.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeanalyzer.backend.dto.AnalysisResponse;
import com.resumeanalyzer.backend.entity.*;
import com.resumeanalyzer.backend.repository.*;
import com.resumeanalyzer.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnhancedAnalysisServiceImpl implements EnhancedAnalysisService {
    @Value("${huggingface.api.token}")
    private String hfToken;
    
    @Value("${app.ai.suggestions.enabled:false}")
    private boolean aiSuggestionsEnabled;
    
    private static final Logger logger = LoggerFactory.getLogger(EnhancedAnalysisServiceImpl.class);
    
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final AnalysisRepository analysisRepository;
    private final SkillExtractionService skillExtractionService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AnalysisResponse performDetailedAnalysis(Long resumeId, Long jdId, User user) {
        LocalDateTime startTime = LocalDateTime.now();
        logger.info("Starting detailed analysis for resume ID: {} and JD ID: {} for user: {}", resumeId, jdId, user.getEmail());
        
        // Fetch data
        Resume resume = resumeRepository.findById(resumeId).orElseThrow();
        JobDescription jd = jobDescriptionRepository.findById(jdId).orElseThrow();
        
        // Simulate processing time for proper deep analysis (5-10 seconds for demonstration)
        // In production, this would be the actual time taken by Hugging Face API calls
        try {
            logger.info("Processing analysis... this may take up to 30 seconds");
            Thread.sleep(8000); // 8 second delay to simulate proper AI processing
        } catch (InterruptedException e) {
            logger.warn("Analysis processing interrupted", e);
            Thread.currentThread().interrupt();
        }
        
        // Extract skills
        List<String> resumeSkills = skillExtractionService.extractSkills(resume.getParsedText());
        List<String> jdSkills = skillExtractionService.extractSkills(jd.getText());
        
        // Calculate matches
        Set<String> matchedSkills = new HashSet<>(resumeSkills);
        matchedSkills.retainAll(jdSkills);
        
        Set<String> missingSkills = new HashSet<>(jdSkills);
        missingSkills.removeAll(resumeSkills);
        
        // Calculate scores
        double overallMatchScore = skillExtractionService.computeSimilarity(resume.getParsedText(), jd.getText());
        double skillMatchScore = calculateSkillMatchScore(resumeSkills, jdSkills);
        
        // Enhanced scoring logic with better weighting
        double finalScore;
        if (missingSkills.isEmpty() && matchedSkills.size() >= 10) {
            // Perfect or near-perfect skill match should get higher scores
            finalScore = Math.max(0.85, (skillMatchScore * 0.8) + (overallMatchScore * 0.2));
        } else {
            // Standard weighted scoring
            finalScore = (skillMatchScore * 0.7) + (overallMatchScore * 0.3);
        }
        
        // Ensure minimum score for good skill matches
        if (skillMatchScore >= 0.9 && missingSkills.size() <= 2) {
            finalScore = Math.max(finalScore, 0.85);
        }
        
        int matchPercentage = (int) Math.round(finalScore * 100);
        
        // Detailed logging for scoring analysis
        logger.info("SCORING BREAKDOWN for Resume {} vs JD {}:", resumeId, jdId);
        logger.info("  Resume Skills Found: {} skills", resumeSkills.size());
        logger.info("  JD Skills Required: {} skills", jdSkills.size());
        logger.info("  Matched Skills: {} skills", matchedSkills.size());
        logger.info("  Missing Skills: {} skills", missingSkills.size());
        logger.info("  Skill Match Score: {:.2f}% ({}/{})", skillMatchScore * 100, matchedSkills.size(), jdSkills.size());
        logger.info("  Semantic Similarity: {:.2f}%", overallMatchScore * 100);
        logger.info("  Final Score: {:.2f}% (Skill: {:.1f}% weight + Semantic: {:.1f}% weight)", 
                   finalScore * 100, skillMatchScore * 0.7 * 100, overallMatchScore * 0.3 * 100);
        logger.info("  Enhanced Scoring Applied: {}", 
                   (missingSkills.isEmpty() && matchedSkills.size() >= 10) ? "Yes (Perfect match bonus)" : "No");
        
        // Combine scores (70% skill match + 30% semantic similarity)
        
        // Generate suggestions
        List<String> improvementSuggestions = generateImprovementSuggestions(new ArrayList<>(missingSkills), finalScore);
        String jobTitle = jd.getTitle() != null ? jd.getTitle() : extractJobTitle(jd.getText());
        List<String> resumeTips = generateResumeTips(finalScore, missingSkills.size(), new ArrayList<>(missingSkills), jobTitle);
        List<String> learningRecommendations = generateLearningRecommendations(new ArrayList<>(missingSkills));
        
        // Categorize skills
        List<AnalysisResponse.SkillCategory> skillCategories = categorizeSkills(resumeSkills, jdSkills);
        Map<String, Double> categoryScores = calculateCategoryScores(skillCategories);
        
        // Determine match level
        String matchLevel = determineMatchLevel(matchPercentage);
        
        // Calculate duration
        LocalDateTime endTime = LocalDateTime.now();
        long durationMs = ChronoUnit.MILLIS.between(startTime, endTime);
        String analysisDuration = durationMs + "ms";
        
        logger.info("Completed detailed analysis for resume ID: {} and JD ID: {} in {}ms ({} seconds)", 
                   resumeId, jdId, durationMs, String.format("%.2f", durationMs / 1000.0));
        
        // Save analysis
        Analysis analysis = saveAnalysis(user, resume, jd, finalScore, matchedSkills, missingSkills, 
                                       String.join("; ", improvementSuggestions),
                                       resumeTips, learningRecommendations);
        
        return AnalysisResponse.builder()
                .id(analysis.getId())
                .resumeId(resumeId)
                .jobDescriptionId(jdId)
                .resumeFileName(resume.getFileName())
                .jobTitle(extractJobTitle(jd.getText()))
                .overallMatchScore(finalScore)
                .matchPercentage(matchPercentage)
                .matchLevel(matchLevel)
                .matchedSkills(new ArrayList<>(matchedSkills))
                .missingSkills(new ArrayList<>(missingSkills))
                .totalRequiredSkills(jdSkills.size())
                .matchedSkillsCount(matchedSkills.size())
                .missingSkillsCount(missingSkills.size())
                .categoryScores(categoryScores)
                .skillCategories(skillCategories)
                .improvementSuggestions(improvementSuggestions)
                .resumeTips(resumeTips)
                .learningRecommendations(learningRecommendations)
                .analyzedAt(LocalDateTime.now())
                .analysisDuration(analysisDuration)
                .build();
    }

    @Override
    public AnalysisResponse getAnalysisById(Long analysisId, User user) {
        Analysis analysis = analysisRepository.findById(analysisId).orElseThrow();
        
        // Reconstruct the response from saved analysis
        try {
            List<String> matchedSkills = objectMapper.readValue(analysis.getMatchedSkills(), List.class);
            List<String> missingSkills = objectMapper.readValue(analysis.getMissingSkills(), List.class);
            List<String> resumeTips = analysis.getResumeTips() != null ? 
                objectMapper.readValue(analysis.getResumeTips(), List.class) : new ArrayList<>();
            List<String> learningRecommendations = analysis.getLearningRecommendations() != null ? 
                objectMapper.readValue(analysis.getLearningRecommendations(), List.class) : new ArrayList<>();
            
            return AnalysisResponse.builder()
                    .id(analysis.getId())
                    .resumeId(analysis.getResume().getId())
                    .jobDescriptionId(analysis.getJobDescription().getId())
                    .resumeFileName(analysis.getResume().getFileName())
                    .jobTitle(extractJobTitle(analysis.getJobDescription().getText()))
                    .overallMatchScore(analysis.getMatchScore())
                    .matchPercentage((int) Math.round(analysis.getMatchScore() * 100))
                    .matchLevel(determineMatchLevel((int) Math.round(analysis.getMatchScore() * 100)))
                    .matchedSkills(matchedSkills)
                    .missingSkills(missingSkills)
                    .totalRequiredSkills(matchedSkills.size() + missingSkills.size())
                    .matchedSkillsCount(matchedSkills.size())
                    .missingSkillsCount(missingSkills.size())
                    .improvementSuggestions(Arrays.asList(analysis.getSuggestions().split("; ")))
                    .resumeTips(resumeTips)
                    .learningRecommendations(learningRecommendations)
                    .analyzedAt(analysis.getCreatedAt())
                    .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize analysis data", e);
        }
    }

    @Override
    public double calculateSkillMatchScore(List<String> resumeSkills, List<String> jdSkills) {
        if (jdSkills.isEmpty()) return 0.0;
        
        Set<String> resumeSet = new HashSet<>(resumeSkills);
        Set<String> jdSet = new HashSet<>(jdSkills);
        
        Set<String> intersection = new HashSet<>(resumeSet);
        intersection.retainAll(jdSet);
        
        return (double) intersection.size() / jdSet.size();
    }

    @Override
    public List<String> generateImprovementSuggestions(List<String> missingSkills, double matchScore) {
        List<String> suggestions = new ArrayList<>();
        
        if (aiSuggestionsEnabled) {
            try {
                // Use AI to generate contextual suggestions
                String context = buildSuggestionContext(missingSkills, matchScore);
                List<String> aiSuggestions = generateAISuggestions(context);
                suggestions.addAll(aiSuggestions);
                
                // Add fallback suggestions if AI fails
                if (suggestions.isEmpty()) {
                    suggestions.addAll(generateFallbackSuggestions(missingSkills, matchScore));
                }
                
            } catch (Exception e) {
                // Fallback to basic suggestions if AI fails
                suggestions.addAll(generateFallbackSuggestions(missingSkills, matchScore));
            }
        } else {
            // Use only fallback suggestions when AI is disabled
            suggestions.addAll(generateFallbackSuggestions(missingSkills, matchScore));
        }
        
        return suggestions;
    }

    @Override
    public List<String> generateResumeTips(double matchScore, int missingSkillsCount) {
        return generateResumeTips(matchScore, missingSkillsCount, new ArrayList<>(), "");
    }

    @Override
    public List<String> generateResumeTips(double matchScore, int missingSkillsCount, List<String> missingSkills, String jobTitle) {
        List<String> tips = new ArrayList<>();
        
        if (aiSuggestionsEnabled) {
            try {
                // First try Hugging Face API for advanced AI tips
                tips.addAll(generateHuggingFaceResumeTips(matchScore, missingSkillsCount, missingSkills, jobTitle));
                
                // If Hugging Face fails, use local AI generation
                if (tips.size() < 5) {
                    tips.addAll(generateAIResumeTips(matchScore, missingSkillsCount, missingSkills, jobTitle));
                }
                
                // Add fallback tips if still insufficient
                if (tips.size() < 5) {
                    List<String> fallbackTips = generateFallbackResumeTips(matchScore, missingSkillsCount);
                    for (String fallbackTip : fallbackTips) {
                        if (!tips.contains(fallbackTip) && tips.size() < 9) {
                            tips.add(fallbackTip);
                        }
                    }
                }
                
            } catch (Exception e) {
                logger.warn("AI resume tips generation failed, using fallback: {}", e.getMessage());
                // Fallback to basic tips if AI fails
                tips.addAll(generateFallbackResumeTips(matchScore, missingSkillsCount));
            }
        } else {
            // Use only fallback tips when AI is disabled
            tips.addAll(generateFallbackResumeTips(matchScore, missingSkillsCount));
        }
        
        return tips;
    }

    @Override
    public List<String> generateLearningRecommendations(List<String> missingSkills) {
        List<String> recommendations = new ArrayList<>();
        
        if (aiSuggestionsEnabled) {
            // Generate smart contextual learning recommendations
            recommendations.addAll(generateSmartLearningRecommendations(missingSkills));
        } else {
            // Use only fallback recommendations when AI is disabled
            recommendations.addAll(generateFallbackLearningRecommendations(missingSkills));
        }
        
        return recommendations;
    }

    private List<AnalysisResponse.SkillCategory> categorizeSkills(List<String> resumeSkills, List<String> jdSkills) {
        Map<String, List<String>> categories = Map.of(
            "Programming Languages", Arrays.asList("Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "Scala"),
            "Frameworks & Libraries", Arrays.asList("Spring Boot", "Django", "React", "Angular", "Vue.js", "Node.js", "Express.js", "Flask", "ASP.NET", "Laravel"),
            "Databases", Arrays.asList("MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQL Server", "SQLite", "Cassandra", "DynamoDB"),
            "Cloud & DevOps", Arrays.asList("AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "GitLab", "GitHub", "CI/CD", "Terraform"),
            "Tools & Technologies", Arrays.asList("Git", "Maven", "Gradle", "npm", "yarn", "Webpack", "Babel", "Jest", "JUnit", "Selenium", "Postman", "Swagger")
        );
        
        List<AnalysisResponse.SkillCategory> skillCategories = new ArrayList<>();
        
        for (Map.Entry<String, List<String>> entry : categories.entrySet()) {
            String categoryName = entry.getKey();
            List<String> categorySkills = entry.getValue();
            
            List<String> relevantJDSkills = jdSkills.stream()
                    .filter(skill -> categorySkills.stream().anyMatch(catSkill -> 
                        skill.toLowerCase().contains(catSkill.toLowerCase())))
                    .collect(Collectors.toList());
            
            List<String> relevantResumeSkills = resumeSkills.stream()
                    .filter(skill -> categorySkills.stream().anyMatch(catSkill -> 
                        skill.toLowerCase().contains(catSkill.toLowerCase())))
                    .collect(Collectors.toList());
            
            if (!relevantJDSkills.isEmpty()) {
                Set<String> matched = new HashSet<>(relevantResumeSkills);
                matched.retainAll(relevantJDSkills);
                
                Set<String> missing = new HashSet<>(relevantJDSkills);
                missing.removeAll(relevantResumeSkills);
                
                double categoryScore = relevantJDSkills.isEmpty() ? 0.0 : 
                    (double) matched.size() / relevantJDSkills.size();
                
                skillCategories.add(AnalysisResponse.SkillCategory.builder()
                        .categoryName(categoryName)
                        .skills(relevantJDSkills)
                        .matchScore(categoryScore)
                        .requiredCount(relevantJDSkills.size())
                        .matchedCount(matched.size())
                        .missingSkills(new ArrayList<>(missing))
                        .build());
            }
        }
        
        return skillCategories;
    }

    private Map<String, Double> calculateCategoryScores(List<AnalysisResponse.SkillCategory> skillCategories) {
        return skillCategories.stream()
                .collect(Collectors.toMap(
                    AnalysisResponse.SkillCategory::getCategoryName,
                    AnalysisResponse.SkillCategory::getMatchScore
                ));
    }

    private Map<String, List<String>> categorizeMissingSkills(List<String> missingSkills) {
        Map<String, List<String>> categories = new HashMap<>();
        
        for (String skill : missingSkills) {
            String category = determineSkillCategory(skill);
            categories.computeIfAbsent(category, k -> new ArrayList<>()).add(skill);
        }
        
        return categories;
    }

    private String determineSkillCategory(String skill) {
        String lowerSkill = skill.toLowerCase();
        
        if (lowerSkill.matches(".*(java|python|javascript|typescript|c\\+\\+|c#|php|ruby|go|rust|swift|kotlin|scala).*")) {
            return "Programming Languages";
        } else if (lowerSkill.matches(".*(spring|django|react|angular|vue|node|express|flask|asp|laravel).*")) {
            return "Frameworks";
        } else if (lowerSkill.matches(".*(mysql|postgresql|mongodb|redis|oracle|sql|dynamodb).*")) {
            return "Databases";
        } else if (lowerSkill.matches(".*(aws|azure|google cloud|docker|kubernetes|jenkins|gitlab|github).*")) {
            return "Cloud Platforms";
        } else {
            return "Tools";
        }
    }

    private String determineMatchLevel(int matchPercentage) {
        if (matchPercentage >= 80) return "Excellent";
        else if (matchPercentage >= 60) return "Good";
        else if (matchPercentage >= 40) return "Fair";
        else return "Poor";
    }

    private String extractJobTitle(String jdText) {
        // Simple extraction - look for common job title patterns
        String[] lines = jdText.split("\n");
        for (String line : lines) {
            String lowerLine = line.toLowerCase();
            if (lowerLine.contains("seeking") || lowerLine.contains("looking for") || lowerLine.contains("position")) {
                return line.trim();
            }
        }
        return "Job Position";
    }

    private Analysis saveAnalysis(User user, Resume resume, JobDescription jd, double matchScore, 
                                Set<String> matchedSkills, Set<String> missingSkills, String suggestions,
                                List<String> resumeTips, List<String> learningRecommendations) {
        try {
            Analysis analysis = Analysis.builder()
                    .user(user)
                    .resume(resume)
                    .jobDescription(jd)
                    .matchScore(matchScore)
                    .matchedSkills(objectMapper.writeValueAsString(matchedSkills))
                    .missingSkills(objectMapper.writeValueAsString(missingSkills))
                    .suggestions(suggestions)
                    .resumeTips(objectMapper.writeValueAsString(resumeTips))
                    .learningRecommendations(objectMapper.writeValueAsString(learningRecommendations))
                    .build();
            return analysisRepository.save(analysis);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize analysis data", e);
        }
    }

    // Smart contextual suggestion generation (no external API dependency)
    private List<String> generateAISuggestions(String context) {
        List<String> suggestions = new ArrayList<>();
        
        try {
            // For now, use rule-based AI-like logic based on context
            // In the future, this could call Hugging Face API
            
            double matchScore = extractMatchScore(context);
            List<String> missingSkills = extractMissingSkills(context);
            String matchLevel = determineMatchLevelFromContext(context);
            
            if (matchScore >= 0.8) {
                suggestions.add("Fine-tune your resume to highlight specific achievements that align with the job requirements");
                suggestions.add("Add quantifiable metrics to demonstrate your impact in previous roles");
                suggestions.add("Consider getting recommendations from colleagues who can vouch for your skills");
            } else if (matchScore >= 0.6) {
                suggestions.add("Focus on acquiring the missing critical skills through online courses or certifications");
                suggestions.add("Highlight transferable skills that demonstrate your adaptability");
                suggestions.add("Add relevant projects or volunteer work that showcase your abilities");
                suggestions.add("Network with professionals in your target industry for insights and opportunities");
            } else if (matchScore >= 0.4) {
                suggestions.add("Consider pursuing additional education or training in your target field");
                suggestions.add("Gain practical experience through internships, freelance work, or personal projects");
                suggestions.add("Identify and focus on developing the most in-demand skills for your industry");
                suggestions.add("Build a portfolio that demonstrates your capabilities and learning progress");
            } else {
                suggestions.add("Consider a career transition plan that includes skill development and education");
                suggestions.add("Look for entry-level positions or roles that allow for growth and skill acquisition");
                suggestions.add("Focus on building foundational skills before targeting advanced positions");
                suggestions.add("Consider working with a career counselor to develop a strategic plan");
            }
            
            // Add specific suggestions based on missing skills
            if (!missingSkills.isEmpty()) {
                suggestions.add("Prioritize learning the following critical skills: " + String.join(", ", missingSkills.subList(0, Math.min(3, missingSkills.size()))));
            }
            
        } catch (Exception e) {
            logger.warn("AI suggestion generation failed: {}", e.getMessage());
            // Return empty list, fallback will be used
        }
        
        return suggestions;
    }

    private List<String> generateFallbackSuggestions(List<String> missingSkills, double matchScore) {
        List<String> suggestions = new ArrayList<>();
        
        // General improvement suggestions based on match score
        if (matchScore >= 0.7) {
            suggestions.add("Your profile is strong! Focus on tailoring your resume to highlight relevant achievements");
            suggestions.add("Add specific metrics and quantifiable results to strengthen your impact statements");
            suggestions.add("Consider obtaining recommendations or endorsements for your key skills");
        } else if (matchScore >= 0.5) {
            suggestions.add("Work on acquiring the missing skills through online courses or certifications");
            suggestions.add("Emphasize transferable skills that demonstrate your potential");
            suggestions.add("Add relevant side projects or volunteer work to showcase your abilities");
            suggestions.add("Network with industry professionals to learn about opportunities");
        } else {
            suggestions.add("Consider additional training or education to bridge the skill gap");
            suggestions.add("Look for entry-level positions that offer learning and growth opportunities");
            suggestions.add("Build a portfolio of projects that demonstrate your commitment to learning");
            suggestions.add("Seek mentorship or career guidance to develop a strategic plan");
        }
        
        // Specific suggestions based on missing skills
        if (!missingSkills.isEmpty()) {
            suggestions.add("Focus on developing these critical skills: " + 
                String.join(", ", missingSkills.subList(0, Math.min(5, missingSkills.size()))));
            
            if (missingSkills.size() > 5) {
                suggestions.add("Prioritize the most important skills first and create a learning timeline");
            }
        }
        
        // Always include these general recommendations
        suggestions.add("Regularly update your resume to reflect your latest skills and experiences");
        suggestions.add("Practice interviewing and articulating your value proposition clearly");
        
        return suggestions;
    }

    private List<String> generateAIResumeTips(double matchScore, int missingSkillsCount, List<String> missingSkills, String jobTitle) {
        List<String> tips = new ArrayList<>();
        
        try {
            // AI-powered contextual resume tips based on the analysis
            
            if (matchScore >= 0.8) {
                tips.add("Your resume is well-aligned! Focus on quantifying achievements with specific metrics and numbers");
                tips.add("Add industry-specific keywords to improve ATS compatibility for " + (jobTitle.isEmpty() ? "your target role" : jobTitle));
                tips.add("Include a compelling professional summary that highlights your strongest qualifications");
            } else if (matchScore >= 0.6) {
                tips.add("Restructure your resume to prominently feature skills that match the job requirements");
                tips.add("Add a 'Key Skills' section to highlight both technical and soft skills");
                tips.add("Include relevant projects or achievements that demonstrate the missing skills: " + 
                    String.join(", ", missingSkills.subList(0, Math.min(3, missingSkills.size()))));
            } else {
                tips.add("Consider a functional resume format to emphasize skills over chronological experience");
                tips.add("Add a 'Professional Development' section to show your commitment to learning");
                tips.add("Focus on transferable skills and any relevant coursework or certifications");
            }
            
            // General AI-powered formatting and content tips
            tips.add("Use strong action verbs like 'implemented', 'optimized', 'led', and 'achieved' to start bullet points");
            tips.add("Keep your resume to 1-2 pages and use consistent formatting throughout");
            tips.add("Tailor your resume for each application by incorporating job-specific keywords");
            
            // Industry-specific tips based on job title
            if (jobTitle != null && !jobTitle.isEmpty()) {
                if (jobTitle.toLowerCase().contains("developer") || jobTitle.toLowerCase().contains("engineer")) {
                    tips.add("Include links to your GitHub profile and showcase your best coding projects");
                    tips.add("Mention specific technologies, frameworks, and programming languages you've used");
                } else if (jobTitle.toLowerCase().contains("manager") || jobTitle.toLowerCase().contains("lead")) {
                    tips.add("Highlight your leadership experience and team management accomplishments");
                    tips.add("Quantify the size of teams or budgets you've managed");
                } else if (jobTitle.toLowerCase().contains("analyst") || jobTitle.toLowerCase().contains("data")) {
                    tips.add("Showcase your analytical tools expertise and data visualization skills");
                    tips.add("Include specific examples of insights or recommendations you've provided");
                }
            }
            
        } catch (Exception e) {
            logger.warn("AI resume tips generation failed: {}", e.getMessage());
        }
        
        return tips;
    }

    private List<String> generateFallbackResumeTips(double matchScore, int missingSkillsCount) {
        List<String> tips = new ArrayList<>();
        
        // Standard resume tips based on analysis
        tips.add("Use a clean, professional format with consistent font and spacing");
        tips.add("Start each bullet point with a strong action verb");
        tips.add("Quantify your achievements with specific numbers and metrics");
        tips.add("Tailor your resume to match the job description keywords");
        tips.add("Include a professional summary at the top of your resume");
        tips.add("List your most relevant experience first");
        tips.add("Proofread carefully for spelling and grammar errors");
        tips.add("Keep your resume to 1-2 pages maximum");
        
        // Additional tips based on match score
        if (matchScore < 0.5) {
            tips.add("Consider highlighting transferable skills and relevant coursework");
            tips.add("Add a 'Professional Development' section to show continuous learning");
        }
        
        if (missingSkillsCount > 3) {
            tips.add("Focus on developing and showcasing the most critical missing skills");
            tips.add("Consider adding a 'Core Competencies' section to highlight your strengths");
        }
        
        return tips;
    }

    private List<String> generateHuggingFaceResumeTips(double matchScore, int missingSkillsCount, List<String> missingSkills, String jobTitle) {
        List<String> tips = new ArrayList<>();
        
        if (hfToken == null || hfToken.isEmpty()) {
            logger.warn("Hugging Face token not configured, skipping API call");
            return tips;
        }
        
        logger.info("Starting Hugging Face API call for resume tips - Token configured: {}, Job title: {}", 
                   !hfToken.isEmpty(), jobTitle != null ? jobTitle : "null");
        
        try {
            // Build a contextual prompt for Hugging Face API
            StringBuilder prompt = new StringBuilder();
            prompt.append("As a professional career advisor, provide resume improvement tips for a job application. ");
            prompt.append("Current match score: ").append(String.format("%.1f%%", matchScore * 100)).append(". ");
            
            if (jobTitle != null && !jobTitle.isEmpty()) {
                prompt.append("Target position: ").append(jobTitle).append(". ");
            }
            
            if (matchScore >= 0.8) {
                prompt.append("The candidate has an excellent match. ");
            } else if (matchScore >= 0.6) {
                prompt.append("The candidate has a good match but needs some improvements. ");
            } else if (matchScore >= 0.4) {
                prompt.append("The candidate has a fair match and needs significant improvements. ");
            } else {
                prompt.append("The candidate has a poor match and needs major improvements. ");
            }
            
            if (!missingSkills.isEmpty()) {
                prompt.append("Missing key skills: ").append(String.join(", ", missingSkills.subList(0, Math.min(5, missingSkills.size())))).append(". ");
            }
            
            prompt.append("\nProvide 6-8 specific, actionable resume tips that will help this candidate improve their application. ");
            prompt.append("Focus on practical formatting, content, and strategy advice. ");
            prompt.append("Make each tip concise and professional. Format as a numbered list.");
            
            // Call Hugging Face API for text generation
            String apiUrl = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(hfToken);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", prompt.toString());
            requestBody.put("parameters", Map.of(
                "max_length", 500,
                "temperature", 0.7,
                "do_sample", true,
                "pad_token_id", 50256
            ));
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            logger.info("Sending request to Hugging Face API: {}", apiUrl);
            ResponseEntity<Object[]> response = restTemplate.postForEntity(apiUrl, entity, Object[].class);
            logger.info("Received response from Hugging Face API - Status: {}, Body length: {}", 
                       response.getStatusCode(), response.getBody() != null ? response.getBody().length : 0);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().length > 0) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> result = mapper.convertValue(response.getBody()[0], Map.class);
                String generatedText = (String) result.get("generated_text");
                
                if (generatedText != null && !generatedText.isEmpty()) {
                    // Parse the generated text to extract tips
                    String[] lines = generatedText.split("\\n");
                    for (String line : lines) {
                        String cleanLine = cleanGeneratedText(line);
                        if (!cleanLine.isEmpty() && cleanLine.length() > 10 && cleanLine.length() < 200) {
                            // Remove numbering if present and clean up
                            String tip = cleanLine.replaceAll("^\\d+\\.", "").trim();
                            if (!tip.isEmpty() && !tips.contains(tip)) {
                                tips.add(tip);
                            }
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warn("Hugging Face API call failed for resume tips: {}", e.getMessage());
        }
        
        // If API failed or returned insufficient tips, fall back to AI-generated tips
        if (tips.size() < 5) {
            tips.addAll(generateAIResumeTips(matchScore, missingSkillsCount, missingSkills, jobTitle));
        }
        
        return tips.stream().distinct().limit(8).collect(Collectors.toList());
    }

    private double extractMatchScore(String context) {
        // Extract match score from context string
        if (context.contains("Match score:")) {
            try {
                String scorePart = context.split("Match score:")[1].split("%")[0].trim();
                return Double.parseDouble(scorePart) / 100.0;
            } catch (Exception e) {
                return 0.5; // default
            }
        }
        return 0.5;
    }
    
    private List<String> extractMissingSkills(String context) {
        List<String> skills = new ArrayList<>();
        if (context.contains("Missing critical skills:")) {
            try {
                String skillsPart = context.split("Missing critical skills:")[1].split("\\.")[0].trim();
                return Arrays.asList(skillsPart.split(", "));
            } catch (Exception e) {
                return skills;
            }
        }
        return skills;
    }
    
    private String determineMatchLevelFromContext(String context) {
        if (context.contains("Excellent match")) return "Excellent";
        if (context.contains("Good match")) return "Good";
        if (context.contains("Fair match")) return "Fair";
        if (context.contains("Poor match")) return "Poor";
        return "Unknown";
    }

    private String buildSuggestionContext(List<String> missingSkills, double matchScore) {
        StringBuilder context = new StringBuilder();
        
        context.append("Job application analysis for resume matching: ");
        context.append("Match score: ").append(String.format("%.1f%%", matchScore * 100)).append(". ");
        
        if (matchScore >= 0.8) {
            context.append("Excellent match - candidate has strong alignment with job requirements. ");
        } else if (matchScore >= 0.6) {
            context.append("Good match - candidate has solid foundation but some gaps. ");
        } else if (matchScore >= 0.4) {
            context.append("Fair match - candidate needs significant upskilling. ");
        } else {
            context.append("Poor match - candidate may not be suitable for this role. ");
        }
        
        if (!missingSkills.isEmpty()) {
            context.append("Missing critical skills: ").append(String.join(", ", missingSkills)).append(". ");
        }
        
        context.append("Provide 3-5 specific, actionable suggestions for improvement that are relevant to any industry or sector. Focus on practical steps the candidate can take.");
        
        return context.toString();
    }

    private String cleanGeneratedText(String text) {
        // Clean up generated text
        return text.replaceAll("\\n", " ")
                  .replaceAll("\\s+", " ")
                  .trim()
                  .replaceAll("^[^a-zA-Z]*", "") // Remove leading non-letters
                  .replaceAll("[^a-zA-Z0-9\\s.,!?-]*$", ""); // Remove trailing non-letters
    }

    private List<String> generateSmartLearningRecommendations(List<String> missingSkills) {
        List<String> recommendations = new ArrayList<>();
        
        try {
            if (aiSuggestionsEnabled && !missingSkills.isEmpty()) {
                // Build context for AI-powered learning recommendations
                StringBuilder context = new StringBuilder();
                context.append("Generate personalized learning recommendations for someone missing these skills: ");
                context.append(String.join(", ", missingSkills));
                context.append(". Provide 5-7 specific learning paths, courses, or resources that would help acquire these skills. ");
                context.append("Focus on practical, actionable learning opportunities.");
                
                // Generate AI recommendations (you could call Hugging Face here too)
                recommendations.addAll(generateAILearningRecommendations(context.toString()));
            }
            
            // Add fallback recommendations if AI fails or returns insufficient results
            if (recommendations.size() < 5) {
                recommendations.addAll(generateFallbackLearningRecommendations(missingSkills));
            }
            
        } catch (Exception e) {
            logger.warn("Smart learning recommendations generation failed: {}", e.getMessage());
            recommendations.addAll(generateFallbackLearningRecommendations(missingSkills));
        }
        
        return recommendations.stream().distinct().limit(7).collect(Collectors.toList());
    }

    private List<String> generateAILearningRecommendations(String context) {
        List<String> recommendations = new ArrayList<>();
        
        // For now, use rule-based AI-like logic
        // In the future, this could call Hugging Face API similar to resume tips
        
        if (context.toLowerCase().contains("java")) {
            recommendations.add("Complete Oracle Java certification courses on Coursera or Udemy");
            recommendations.add("Practice Java coding challenges on LeetCode and HackerRank");
            recommendations.add("Build projects using Spring Boot framework");
        }
        
        if (context.toLowerCase().contains("python")) {
            recommendations.add("Take Python for Data Science course on edX or Coursera");
            recommendations.add("Complete Python certification from Python Institute");
            recommendations.add("Practice Python projects on GitHub and Kaggle");
        }
        
        if (context.toLowerCase().contains("javascript") || context.toLowerCase().contains("react") || context.toLowerCase().contains("node")) {
            recommendations.add("Master JavaScript fundamentals through freeCodeCamp");
            recommendations.add("Build full-stack projects with React and Node.js");
            recommendations.add("Complete AWS or Azure cloud development certifications");
        }
        
        if (context.toLowerCase().contains("sql") || context.toLowerCase().contains("database")) {
            recommendations.add("Get MySQL or PostgreSQL database administrator certification");
            recommendations.add("Practice SQL queries on SQLBolt and W3Schools");
            recommendations.add("Learn database design and normalization principles");
        }
        
        if (context.toLowerCase().contains("cloud") || context.toLowerCase().contains("aws") || context.toLowerCase().contains("azure")) {
            recommendations.add("Earn AWS Solutions Architect or Azure Fundamentals certification");
            recommendations.add("Complete hands-on cloud projects and labs");
            recommendations.add("Join cloud computing communities and forums");
        }
        
        // Add general recommendations
        recommendations.add("Consider bootcamps or intensive courses for rapid skill acquisition");
        recommendations.add("Join professional communities and attend industry meetups");
        recommendations.add("Build a portfolio showcasing your new skills");
        
        return recommendations;
    }

    private List<String> generateFallbackLearningRecommendations(List<String> missingSkills) {
        List<String> recommendations = new ArrayList<>();
        
        // General learning recommendations
        recommendations.add("Consider taking online courses on platforms like Coursera, Udemy, or edX");
        recommendations.add("Practice coding challenges on platforms like LeetCode, HackerRank, or CodeWars");
        recommendations.add("Join professional communities and forums related to your target skills");
        recommendations.add("Attend industry conferences, workshops, and networking events");
        recommendations.add("Build personal projects to demonstrate your new skills");
        
        // Skill-specific recommendations based on missing skills
        if (missingSkills.stream().anyMatch(skill -> skill.toLowerCase().contains("programming") || 
                skill.toLowerCase().contains("coding") || skill.toLowerCase().contains("development"))) {
            recommendations.add("Contribute to open-source projects on GitHub");
            recommendations.add("Consider bootcamp programs for intensive learning");
        }
        
        if (missingSkills.stream().anyMatch(skill -> skill.toLowerCase().contains("data") || 
                skill.toLowerCase().contains("analytics") || skill.toLowerCase().contains("science"))) {
            recommendations.add("Complete data science specializations on Coursera or edX");
            recommendations.add("Practice with real datasets on Kaggle");
        }
        
        if (missingSkills.stream().anyMatch(skill -> skill.toLowerCase().contains("cloud") || 
                skill.toLowerCase().contains("aws") || skill.toLowerCase().contains("azure"))) {
            recommendations.add("Pursue cloud certifications (AWS, Azure, Google Cloud)");
            recommendations.add("Set up personal cloud projects and labs");
        }
        
        // Always add these general recommendations
        recommendations.add("Create a learning schedule and stick to it consistently");
        recommendations.add("Find a mentor or join study groups for guidance and accountability");
        
        return recommendations;
    }
}