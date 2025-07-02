package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;
import com.resumeanalyzer.backend.service.CandidateAnalysisService;
import com.resumeanalyzer.backend.service.SkillExtractionService;
import com.resumeanalyzer.backend.service.LLMAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateAnalysisServiceImpl implements CandidateAnalysisService {
    
    private final SkillExtractionService skillExtractionService;
    private final LLMAnalysisService llmAnalysisService;
    
    // Common skill categories and their keywords
    private static final Map<String, List<String>> SKILL_CATEGORIES = Map.of(
        "Programming", Arrays.asList("java", "python", "javascript", "c++", "c#", "go", "rust", "php", "ruby", "kotlin", "swift", "typescript"),
        "Frontend", Arrays.asList("react", "angular", "vue", "html", "css", "sass", "bootstrap", "tailwind", "material-ui", "nextjs"),
        "Backend", Arrays.asList("spring", "express", "django", "flask", "nodejs", "dotnet", ".net", "laravel", "rails"),
        "Database", Arrays.asList("mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra", "oracle", "sql server"),
        "Cloud", Arrays.asList("aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible"),
        "Data Science", Arrays.asList("pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "spark", "hadoop", "tableau"),
        "Mobile", Arrays.asList("android", "ios", "react native", "flutter", "xamarin", "ionic", "swift", "kotlin"),
        "Testing", Arrays.asList("junit", "selenium", "cypress", "jest", "mocha", "pytest", "testng")
    );
    
    private static final List<String> EXPERIENCE_KEYWORDS = Arrays.asList(
        "years", "year", "experience", "worked", "developed", "led", "managed", "created", "built", "designed", "implemented"
    );
    
    private static final List<String> SENIOR_INDICATORS = Arrays.asList(
        "senior", "lead", "principal", "architect", "manager", "director", "head", "chief", "vp", "vice president"
    );
    
    private static final List<String> LEADERSHIP_INDICATORS = Arrays.asList(
        "lead", "manager", "director", "supervisor", "coordinator", "head", "chief", "team lead", 
        "project manager", "scrum master", "product manager", "tech lead", "engineering manager"
    );
    
    private static final List<String> SENIOR_RESPONSIBILITIES = Arrays.asList(
        "mentoring", "mentored", "leading", "managing", "architecture", "strategic", "roadmap",
        "stakeholder", "cross-functional", "team building", "hiring", "performance review",
        "budget", "planning", "strategy", "vision", "scaling", "optimization"
    );
    
    private static final List<String> EDUCATION_KEYWORDS = Arrays.asList(
        "bachelor", "master", "phd", "degree", "university", "college", "computer science", "engineering", "mba"
    );

    @Override
    public CandidateAnalysisDTO analyzeWithJobDescription(String resumeText, String jdText) {
        System.out.println("CandidateAnalysisService: Starting optimized analysis with JD...");
        long startTime = System.currentTimeMillis();
        
        // Try LLM Enhanced Analysis with JD if available
        if (llmAnalysisService.isLLMAvailable()) {
            try {
                System.out.println("CandidateAnalysisService: Starting LLM enhanced JD analysis...");
                CandidateAnalysisDTO llmAnalysis = llmAnalysisService.enhanceAnalysisWithLLM(resumeText, jdText);
                
                long endTime = System.currentTimeMillis();
                System.out.println("CandidateAnalysisService: LLM JD analysis completed in " + (endTime - startTime) + "ms");
                
                return llmAnalysis;
            } catch (Exception e) {
                System.err.println("LLM JD analysis failed, falling back to rule-based analysis: " + e.getMessage());
                // Fall through to rule-based analysis
            }
        }
        
        // Fallback to original rule-based analysis
        // Perform base analysis
        CandidateAnalysisDTO analysis = analyzeWithoutJobDescription(resumeText);
        
        // Extract skills efficiently (reuse from base analysis)
        List<String> resumeSkills = analysis.getSkills();
        List<String> jdSkills = skillExtractionService.extractSkills(jdText);
        
        // Fast skill matching using sets for O(1) lookup
        Set<String> jdSkillsSet = jdSkills.stream()
            .map(String::toLowerCase)
            .collect(Collectors.toSet());
        
        Set<String> resumeSkillsSet = resumeSkills.stream()
            .map(String::toLowerCase)
            .collect(Collectors.toSet());
        
        // Calculate matches efficiently
        List<String> matchedSkills = resumeSkills.stream()
            .filter(skill -> jdSkillsSet.contains(skill.toLowerCase()) ||
                           jdSkillsSet.stream().anyMatch(jdSkill -> 
                               jdSkill.contains(skill.toLowerCase()) || 
                               skill.toLowerCase().contains(jdSkill)))
            .collect(Collectors.toList());
            
        List<String> missingSkills = jdSkills.stream()
            .filter(skill -> !resumeSkillsSet.contains(skill.toLowerCase()) &&
                           !resumeSkillsSet.stream().anyMatch(resumeSkill -> 
                               resumeSkill.toLowerCase().contains(skill.toLowerCase())))
            .limit(10) // Limit to prevent excessive processing
            .collect(Collectors.toList());
        
        double jdMatchPercentage = jdSkills.isEmpty() ? 0 : 
            (double) matchedSkills.size() / jdSkills.size() * 100;
        
        // Enhanced overall score with JD consideration
        double jdBonus = jdMatchPercentage / 100 * 0.4; // 40% weight for JD match
        double enhancedScore = (analysis.getOverallScore() * 0.6) + jdBonus;
        
        // Generate simple JD-specific suggestions
        List<String> jdSuggestions = generateQuickJDSuggestions(matchedSkills, missingSkills);
        
        long endTime = System.currentTimeMillis();
        System.out.println("CandidateAnalysisService: JD analysis completed in " + (endTime - startTime) + "ms");
        
        return analysis.toBuilder()
            .overallScore(Math.min(1.0, enhancedScore))
            .suggestions(jdSuggestions)
            .matchedSkills(matchedSkills)
            .missingSkills(missingSkills)
            .jdMatchPercentage(jdMatchPercentage)
            .hasJD(true)
            .improvementSuggestions(jdSuggestions)
            .fitAssessment(generateQuickFitAssessment(jdMatchPercentage))
            .build();
    }

    @Override
    public CandidateAnalysisDTO analyzeWithoutJobDescription(String resumeText) {
        System.out.println("CandidateAnalysisService: Starting optimized analysis without JD...");
        long startTime = System.currentTimeMillis();
        
        String cleanText = resumeText.toLowerCase();
        
        // Extract all data in one pass to avoid repeated processing
        System.out.println("CandidateAnalysisService: Extracting data...");
        List<String> skillsList = skillExtractionService.extractSkills(resumeText);
        int totalYears = extractTotalYearsExperience(resumeText);
        String experienceLevel = determineExperienceLevel(totalYears, resumeText);
        
        // Quick section extraction using simple patterns
        String skillsSection = extractSimpleSection(resumeText, "skills");
        String experienceSection = extractSimpleSection(resumeText, "experience");
        String projectsSection = extractSimpleSection(resumeText, "projects");
        String educationSection = extractSimpleSection(resumeText, "education");
        
        // Calculate scores efficiently
        double skillsScore = calculateQuickSkillsScore(skillsList);
        double experienceScore = calculateQuickExperienceScore(totalYears, resumeText);
        double educationScore = calculateQuickEducationScore(cleanText);
        double projectsScore = calculateQuickProjectsScore(projectsSection);
        
        // Calculate overall score (weighted average)
        double overallScore = (skillsScore * 0.35) + (experienceScore * 0.35) + 
                             (projectsScore * 0.20) + (educationScore * 0.10);
        
        // Extract structured data efficiently
        List<String> projectsList = extractQuickProjects(projectsSection);
        List<String> hackathonsList = extractQuickHackathons(resumeText);
        List<String> educationList = extractQuickEducation(educationSection);
        
        // Generate basic insights
        String strength = determineQuickStrength(skillsScore, experienceScore, projectsScore, educationScore);
        String weakness = determineQuickWeakness(skillsScore, experienceScore, projectsScore, educationScore);
        List<String> improvements = generateQuickImprovements(skillsScore, experienceScore, projectsScore);
        
        // Try LLM Enhanced Analysis if available
        if (llmAnalysisService.isLLMAvailable()) {
            try {
                System.out.println("CandidateAnalysisService: Starting LLM enhanced analysis...");
                CandidateAnalysisDTO llmAnalysis = llmAnalysisService.analyzeResumeWithLLM(resumeText);
                
                // Merge LLM insights with rule-based analysis
                long endTime = System.currentTimeMillis();
                System.out.println("CandidateAnalysisService: LLM analysis completed in " + (endTime - startTime) + "ms");
                
                return CandidateAnalysisDTO.builder()
                    .overallScore(llmAnalysis.getOverallScore())
                    .skillsScore(llmAnalysis.getSkillsScore())
                    .experienceScore(llmAnalysis.getExperienceScore())
                    .educationScore(llmAnalysis.getEducationScore())
                    .projectsScore(llmAnalysis.getProjectsScore())
                    .skills(llmAnalysis.getSkills() != null && !llmAnalysis.getSkills().isEmpty() ? llmAnalysis.getSkills() : skillsList)
                    .projects(llmAnalysis.getProjects() != null && !llmAnalysis.getProjects().isEmpty() ? llmAnalysis.getProjects() : projectsList)
                    .hackathons(hackathonsList != null ? hackathonsList : List.of())
                    .education(llmAnalysis.getEducation() != null && !llmAnalysis.getEducation().isEmpty() ? llmAnalysis.getEducation() : educationList)
                    .suggestions(llmAnalysis.getImprovementSuggestions() != null && !llmAnalysis.getImprovementSuggestions().isEmpty() ? llmAnalysis.getImprovementSuggestions() : improvements)
                    .matchedSkills(List.of()) // Initialize empty list since no JD provided
                    .missingSkills(List.of()) // Initialize empty list since no JD provided
                    .suggestedSkills(List.of()) // Initialize empty list since no JD provided
                    .experienceHighlights(List.of("Experience: " + llmAnalysis.getTotalYearsExperience() + " years"))
                    .projectHighlights(llmAnalysis.getProjects() != null && llmAnalysis.getProjects().size() > 3 ? llmAnalysis.getProjects().subList(0, 3) : (llmAnalysis.getProjects() != null ? llmAnalysis.getProjects() : List.of()))
                    .educationHighlights(llmAnalysis.getEducation() != null ? llmAnalysis.getEducation() : List.of())
                    .certificationHighlights(List.of())
                    .totalYearsExperience(llmAnalysis.getTotalYearsExperience())
                    .experienceLevel(llmAnalysis.getExperienceLevel())
                    .keywordMatches(List.of()) // Initialize empty list since no JD provided
                    .jdMatchPercentage(0.0) // No JD provided
                    .skillCategoryScores(Map.of())
                    .skillCategoryCounts(Map.of())
                    .candidateStrength(llmAnalysis.getCandidateStrength() != null && !llmAnalysis.getCandidateStrength().isEmpty() ? llmAnalysis.getCandidateStrength() : strength)
                    .candidateWeakness(llmAnalysis.getCandidateWeakness() != null && !llmAnalysis.getCandidateWeakness().isEmpty() ? llmAnalysis.getCandidateWeakness() : weakness)
                    .improvementSuggestions(llmAnalysis.getImprovementSuggestions() != null && !llmAnalysis.getImprovementSuggestions().isEmpty() ? llmAnalysis.getImprovementSuggestions() : improvements)
                    .resumeTips(List.of())
                    .learningRecommendations(llmAnalysis.getImprovementSuggestions() != null ? llmAnalysis.getImprovementSuggestions() : List.of())
                    .extractedSkills(llmAnalysis.getExtractedSkills())
                    .extractedExperience(llmAnalysis.getExtractedExperience())
                    .extractedProjects(llmAnalysis.getExtractedProjects())
                    .extractedEducation(llmAnalysis.getExtractedEducation())
                    .extractedCertifications("")
                    .hasJD(false)
                    .fitAssessment(llmAnalysis.getFitAssessment())
                    .build();
            } catch (Exception e) {
                System.err.println("LLM analysis failed, falling back to rule-based analysis: " + e.getMessage());
                // Fall through to rule-based analysis
            }
        }
        
        long endTime = System.currentTimeMillis();
        System.out.println("CandidateAnalysisService: Base analysis completed in " + (endTime - startTime) + "ms");
        
        return CandidateAnalysisDTO.builder()
            .overallScore(overallScore)
            .skillsScore(skillsScore)
            .experienceScore(experienceScore)
            .educationScore(educationScore)
            .projectsScore(projectsScore)
            .skills(skillsList != null ? skillsList : List.of())
            .projects(projectsList != null ? projectsList : List.of())
            .hackathons(hackathonsList != null ? hackathonsList : List.of())
            .education(educationList != null ? educationList : List.of())
            .suggestions(improvements != null ? improvements : List.of())
            .matchedSkills(List.of()) // Initialize empty list since no JD provided
            .missingSkills(List.of()) // Initialize empty list since no JD provided
            .suggestedSkills(List.of()) // Initialize empty list since no JD provided
            .experienceHighlights(List.of("Experience: " + totalYears + " years"))
            .projectHighlights(projectsList != null && projectsList.size() > 3 ? projectsList.subList(0, 3) : (projectsList != null ? projectsList : List.of()))
            .educationHighlights(educationList != null ? educationList : List.of())
            .certificationHighlights(List.of()) // Minimal processing
            .totalYearsExperience(totalYears)
            .experienceLevel(experienceLevel)
            .keywordMatches(List.of()) // Initialize empty list since no JD provided
            .jdMatchPercentage(0.0) // No JD provided
            .skillCategoryScores(Map.of()) // Minimal processing for speed
            .skillCategoryCounts(Map.of()) // Minimal processing for speed
            .candidateStrength(strength)
            .candidateWeakness(weakness)
            .improvementSuggestions(improvements != null ? improvements : List.of())
            .resumeTips(List.of()) // Minimal processing for speed
            .learningRecommendations(List.of()) // Minimal processing for speed
            .extractedSkills(skillsSection)
            .extractedExperience(experienceSection)
            .extractedProjects(projectsSection)
            .extractedEducation(educationSection)
            .extractedCertifications("") // Minimal processing for speed
            .hasJD(false)
            .fitAssessment("General candidate assessment")
            .build();
    }

    @Override
    public double calculateSkillsScore(String resumeText) {
        List<String> skills = skillExtractionService.extractSkills(resumeText);
        
        // Base score from skill count
        double baseScore = Math.min(1.0, skills.size() / 20.0);
        
        // Bonus for diverse skill categories
        Map<String, Integer> categoryCounts = calculateSkillCategoryCounts(resumeText);
        double diversityBonus = Math.min(0.3, categoryCounts.size() / 8.0 * 0.3);
        
        // Bonus for in-demand skills
        double demandBonus = calculateInDemandSkillsBonus(skills);
        
        return Math.min(1.0, baseScore + diversityBonus + demandBonus);
    }

    @Override
    public double calculateExperienceScore(String resumeText) {
        int totalYears = extractTotalYearsExperience(resumeText);
        
        // Base score from years (0-1 scale, max at 10+ years)
        double yearsScore = Math.min(1.0, totalYears / 10.0);
        
        // Bonus for leadership indicators
        double leadershipBonus = containsLeadershipKeywords(resumeText) ? 0.2 : 0;
        
        // Bonus for career progression
        double progressionBonus = hasCareerProgression(resumeText) ? 0.1 : 0;
        
        return Math.min(1.0, yearsScore + leadershipBonus + progressionBonus);
    }

    @Override
    public double calculateEducationScore(String resumeText) {
        String cleanText = resumeText.toLowerCase();
        double score = 0.0;
        
        // Higher degree = higher score
        if (cleanText.contains("phd") || cleanText.contains("doctorate")) {
            score = 1.0;
        } else if (cleanText.contains("master") || cleanText.contains("mba")) {
            score = 0.8;
        } else if (cleanText.contains("bachelor") || cleanText.contains("b.tech") || cleanText.contains("b.e")) {
            score = 0.6;
        } else if (cleanText.contains("diploma") || cleanText.contains("associate")) {
            score = 0.4;
        }
        
        // Bonus for relevant field
        if (cleanText.contains("computer science") || cleanText.contains("software") || 
            cleanText.contains("information technology") || cleanText.contains("engineering")) {
            score += 0.2;
        }
        
        return Math.min(1.0, score);
    }

    @Override
    public double calculateProjectsScore(String resumeText) {
        String projectsSection = extractSection(resumeText, "projects?");
        if (projectsSection.isEmpty()) return 0.0;
        
        // Count project indicators
        long projectCount = Arrays.stream(projectsSection.split("\n"))
            .filter(line -> line.trim().length() > 10)
            .count();
        
        double baseScore = Math.min(1.0, projectCount / 5.0);
        
        // Bonus for tech stack diversity
        List<String> projectSkills = skillExtractionService.extractSkills(projectsSection);
        double techBonus = Math.min(0.3, projectSkills.size() / 10.0 * 0.3);
        
        // Bonus for project complexity indicators
        double complexityBonus = hasComplexityIndicators(projectsSection) ? 0.2 : 0;
        
        return Math.min(1.0, baseScore + techBonus + complexityBonus);
    }
    
    // Optimized helper methods for faster processing
    
    private String extractSimpleSection(String text, String sectionName) {
        String lowerText = text.toLowerCase();
        String lowerSection = sectionName.toLowerCase();
        
        int startIndex = lowerText.indexOf(lowerSection);
        if (startIndex == -1) return "";
        
        int endIndex = lowerText.indexOf("\n\n", startIndex);
        if (endIndex == -1) endIndex = Math.min(startIndex + 500, text.length()); // Limit section size
        
        return text.substring(startIndex, endIndex);
    }
    
    private double calculateQuickSkillsScore(List<String> skills) {
        if (skills.isEmpty()) return 0.1; // Minimum score for having a resume
        
        // More realistic scoring based on skill count and quality
        int skillCount = skills.size();
        double baseScore;
        
        if (skillCount >= 20) baseScore = 0.85; // Exceptional skill breadth
        else if (skillCount >= 15) baseScore = 0.75; // Strong skill set
        else if (skillCount >= 10) baseScore = 0.60; // Good skill set
        else if (skillCount >= 5) baseScore = 0.45; // Decent skill set
        else if (skillCount >= 3) baseScore = 0.30; // Basic skill set
        else baseScore = 0.15; // Minimal skills
        
        // Check for advanced/in-demand skills to add variance
        Set<String> skillsLower = skills.stream()
            .map(String::toLowerCase)
            .collect(Collectors.toSet());
        
        double advancedBonus = 0.0;
        if (skillsLower.contains("kubernetes") || skillsLower.contains("docker") || 
            skillsLower.contains("aws") || skillsLower.contains("azure") ||
            skillsLower.contains("microservices") || skillsLower.contains("system design")) {
            advancedBonus += 0.1;
        }
        
        // Check for diverse technology stack
        boolean hasFrontend = skillsLower.stream().anyMatch(s -> 
            s.contains("react") || s.contains("angular") || s.contains("vue") || s.contains("html"));
        boolean hasBackend = skillsLower.stream().anyMatch(s -> 
            s.contains("spring") || s.contains("express") || s.contains("django") || s.contains("flask"));
        boolean hasDatabase = skillsLower.stream().anyMatch(s -> 
            s.contains("sql") || s.contains("mysql") || s.contains("postgresql") || s.contains("mongodb"));
        
        double stackBonus = 0.0;
        if (hasFrontend && hasBackend && hasDatabase) stackBonus = 0.1; // Full stack
        else if ((hasFrontend && hasBackend) || (hasBackend && hasDatabase)) stackBonus = 0.05;
        
        return Math.min(1.0, baseScore + advancedBonus + stackBonus);
    }
    
    private double calculateQuickExperienceScore(int totalYears, String resumeText) {
        // More differentiated experience scoring
        double yearsScore;
        
        if (totalYears == 0) yearsScore = 0.0; // No experience
        else if (totalYears <= 1) yearsScore = 0.25; // Entry level
        else if (totalYears <= 3) yearsScore = 0.50; // Junior
        else if (totalYears <= 6) yearsScore = 0.70; // Mid-level
        else if (totalYears <= 10) yearsScore = 0.85; // Senior
        else yearsScore = 0.95; // Very senior
        
        // Quick leadership and responsibility check for bonus
        String lowerText = resumeText.toLowerCase();
        double responsibilityBonus = 0.0;
        
        if (lowerText.contains("architect") || lowerText.contains("principal") || lowerText.contains("director")) {
            responsibilityBonus = 0.15;
        } else if (lowerText.contains("senior") || lowerText.contains("lead") || lowerText.contains("manager")) {
            responsibilityBonus = 0.10;
        } else if (lowerText.contains("mentoring") || lowerText.contains("team") || lowerText.contains("coordinate")) {
            responsibilityBonus = 0.05;
        }
        
        return Math.min(1.0, yearsScore + responsibilityBonus);
    }
    
    private double calculateQuickEducationScore(String cleanText) {
        double score = 0.0;
        
        // Quick education level check
        if (cleanText.contains("phd") || cleanText.contains("doctorate")) {
            score = 0.9;
        } else if (cleanText.contains("master") || cleanText.contains("mba")) {
            score = 0.7;
        } else if (cleanText.contains("bachelor") || cleanText.contains("b.tech") || cleanText.contains("b.e")) {
            score = 0.6;
        } else if (cleanText.contains("diploma")) {
            score = 0.4;
        }
        
        // Quick field relevance check
        if (cleanText.contains("computer") || cleanText.contains("software") || 
            cleanText.contains("engineering") || cleanText.contains("technology")) {
            score += 0.1;
        }
        
        return Math.min(1.0, score);
    }
    
    private double calculateQuickProjectsScore(String projectsSection) {
        if (projectsSection.isEmpty()) return 0.1; // Minimum for having some content
        
        // Count meaningful project indicators
        String lowerProjects = projectsSection.toLowerCase();
        
        // Count project indicators more intelligently
        int projectCount = 0;
        projectCount += countOccurrences(lowerProjects, "project");
        projectCount += countOccurrences(lowerProjects, "developed");
        projectCount += countOccurrences(lowerProjects, "built");
        projectCount += countOccurrences(lowerProjects, "created");
        projectCount += countOccurrences(lowerProjects, "implemented");
        
        // Score based on project depth and variety
        double baseScore;
        if (projectCount >= 8) baseScore = 0.85; // Many projects
        else if (projectCount >= 5) baseScore = 0.70; // Good project portfolio
        else if (projectCount >= 3) baseScore = 0.55; // Decent projects
        else if (projectCount >= 1) baseScore = 0.35; // Some projects
        else baseScore = 0.15; // Minimal project content
        
        // Bonus for advanced project features
        double complexityBonus = 0.0;
        if (lowerProjects.contains("machine learning") || lowerProjects.contains("ai") || 
            lowerProjects.contains("blockchain") || lowerProjects.contains("microservices")) {
            complexityBonus += 0.15;
        } else if (lowerProjects.contains("api") || lowerProjects.contains("database") || 
                   lowerProjects.contains("authentication") || lowerProjects.contains("deployment")) {
            complexityBonus += 0.10;
        } else if (lowerProjects.contains("responsive") || lowerProjects.contains("crud") || 
                   lowerProjects.contains("frontend") || lowerProjects.contains("backend")) {
            complexityBonus += 0.05;
        }
        
        // Bonus for mentioning specific technologies
        double techStackBonus = 0.0;
        String[] modernTech = {"react", "node", "python", "java", "spring", "docker", "aws", "mongodb", "postgresql"};
        int techCount = 0;
        for (String tech : modernTech) {
            if (lowerProjects.contains(tech)) techCount++;
        }
        if (techCount >= 5) techStackBonus = 0.10;
        else if (techCount >= 3) techStackBonus = 0.05;
        
        return Math.min(1.0, baseScore + complexityBonus + techStackBonus);
    }
    
    // Helper method for counting occurrences
    private int countOccurrences(String text, String pattern) {
        return text.split(pattern, -1).length - 1;
    }
    
    private List<String> extractQuickProjects(String projectsSection) {
        if (projectsSection.isEmpty()) return List.of();
        
        // Simple extraction - split by common delimiters and filter
        return Arrays.stream(projectsSection.split("[\n•-]"))
            .map(String::trim)
            .filter(line -> line.length() > 20 && line.length() < 200) // Reasonable project description length
            .limit(8) // Limit for performance
            .collect(Collectors.toList());
    }
    
    private List<String> extractQuickHackathons(String resumeText) {
        String lowerText = resumeText.toLowerCase();
        List<String> hackathons = new ArrayList<>();
        
        // Quick pattern matching for hackathons
        if (lowerText.contains("hackathon")) {
            String[] lines = resumeText.split("\n");
            for (String line : lines) {
                if (line.toLowerCase().contains("hackathon") && line.length() > 10 && line.length() < 150) {
                    hackathons.add(line.trim());
                    if (hackathons.size() >= 5) break; // Limit for performance
                }
            }
        }
        
        return hackathons;
    }
    
    private List<String> extractQuickEducation(String educationSection) {
        if (educationSection.isEmpty()) return List.of();
        
        List<String> courses = new ArrayList<>();
        String lowerText = educationSection.toLowerCase();
        
        // Extract only course/degree names, not institutions or years
        if (lowerText.contains("mca") && !courses.contains("MCA - Master of Computer Applications")) {
            courses.add("MCA - Master of Computer Applications");
        }
        if (lowerText.contains("bca") && !courses.contains("BCA - Bachelor of Computer Applications")) {
            courses.add("BCA - Bachelor of Computer Applications");
        }
        if ((lowerText.contains("b.tech") || lowerText.contains("btech")) && !courses.contains("B.Tech Engineering")) {
            if (lowerText.contains("computer science")) {
                courses.add("B.Tech Computer Science");
            } else {
                courses.add("B.Tech Engineering");
            }
        }
        if (lowerText.contains("bachelor") && lowerText.contains("computer") && !courses.contains("Bachelor of Computer Science")) {
            courses.add("Bachelor of Computer Science");
        }
        if (lowerText.contains("master") && lowerText.contains("computer") && !courses.contains("Master of Computer Science")) {
            courses.add("Master of Computer Science");
        }
        if (lowerText.contains("mba") && !courses.contains("MBA - Master of Business Administration")) {
            courses.add("MBA - Master of Business Administration");
        }
        
        return courses.isEmpty() ? List.of("Degree") : courses.stream().distinct().limit(3).collect(Collectors.toList());
    }
    
    private String determineQuickStrength(double skillsScore, double experienceScore, double projectsScore, double educationScore) {
        double maxScore = Math.max(Math.max(skillsScore, experienceScore), Math.max(projectsScore, educationScore));
        
        if (maxScore == skillsScore) return "Technical Skills";
        else if (maxScore == experienceScore) return "Professional Experience";
        else if (maxScore == projectsScore) return "Project Portfolio";
        else return "Educational Background";
    }
    
    private String determineQuickWeakness(double skillsScore, double experienceScore, double projectsScore, double educationScore) {
        double minScore = Math.min(Math.min(skillsScore, experienceScore), Math.min(projectsScore, educationScore));
        
        if (minScore == skillsScore) return "Technical Skills";
        else if (minScore == experienceScore) return "Professional Experience";
        else if (minScore == projectsScore) return "Project Portfolio";
        else return "Educational Background";
    }
    
    private List<String> generateQuickImprovements(double skillsScore, double experienceScore, double projectsScore) {
        List<String> improvements = new ArrayList<>();
        
        if (skillsScore < 0.6) {
            improvements.add("Consider highlighting more technical skills and certifications");
        }
        if (experienceScore < 0.6) {
            improvements.add("Emphasize leadership roles and career progression");
        }
        if (projectsScore < 0.6) {
            improvements.add("Add more detailed project descriptions with technologies used");
        }
        
        return improvements;
    }
    
    private List<String> generateQuickJDSuggestions(List<String> matchedSkills, List<String> missingSkills) {
        List<String> suggestions = new ArrayList<>();
        
        if (!matchedSkills.isEmpty()) {
            suggestions.add("Strong match with " + matchedSkills.size() + " required skills");
        }
        
        if (!missingSkills.isEmpty() && missingSkills.size() <= 3) {
            suggestions.add("Consider gaining experience in: " + String.join(", ", missingSkills));
        } else if (missingSkills.size() > 3) {
            suggestions.add("Consider gaining experience in key missing skills");
        }
        
        return suggestions;
    }
    
    private String generateQuickFitAssessment(double jdMatchPercentage) {
        if (jdMatchPercentage >= 80) return "Excellent fit for the role";
        else if (jdMatchPercentage >= 60) return "Good fit with some areas for development";
        else if (jdMatchPercentage >= 40) return "Moderate fit, may need additional training";
        else return "Limited fit, significant skill gap";
    }

    // Helper methods
    private String extractSection(String text, String sectionPattern) {
        Pattern pattern = Pattern.compile("(?i)(" + sectionPattern + ")\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*[A-Z][A-Za-z\\s]*:|$)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(2).trim();
        }
        return "";
    }
    
    private int extractTotalYearsExperience(String resumeText) {
        String cleanText = resumeText.toLowerCase();
        
        // STRICT student/fresher detection - return 0 immediately
        if (cleanText.contains("fresher") || 
            cleanText.contains("recent graduate") ||
            cleanText.contains("seeking first job") ||
            cleanText.contains("no experience") ||
            cleanText.contains("entry level") ||
            cleanText.contains("pursuing") ||
            cleanText.contains("currently pursuing") ||
            cleanText.contains("student") ||
            cleanText.contains("final year") ||
            cleanText.contains("expected graduation") ||
            cleanText.contains("graduation expected") ||
            cleanText.contains("currently studying") ||
            cleanText.contains("pursuing degree") ||
            (cleanText.contains("mca") && !cleanText.contains("work") && !cleanText.contains("employ")) ||
            (cleanText.contains("bachelor") && !cleanText.contains("work") && !cleanText.contains("employ"))) {
            return 0;
        }
        
        // Check if this is a current student (future graduation date)
        Pattern currentStudentPattern = Pattern.compile("(20\\d{2})\\s*[-–]\\s*(202[5-9])", Pattern.CASE_INSENSITIVE);
        Matcher currentStudentMatcher = currentStudentPattern.matcher(resumeText);
        if (currentStudentMatcher.find()) {
            return 0; // Current student with future graduation
        }
        
        // Check for education-only patterns (no work experience)
        Pattern educationOnlyPattern = Pattern.compile("(bachelor|master|mca|bca|degree).*?(20\\d{2})\\s*[-–]\\s*(20\\d{2})", Pattern.CASE_INSENSITIVE);
        Matcher educationMatcher = educationOnlyPattern.matcher(resumeText);
        boolean hasEducationDates = educationMatcher.find();
        
        // If we only see education dates and no work indicators, return 0
        if (hasEducationDates && !detectWorkExperience(cleanText)) {
            return 0;
        }
        
        // Look for explicit experience years mentioned
        Pattern yearsPattern = Pattern.compile("(\\d+)\\s*\\+?\\s*years?.*?(experience|work)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = yearsPattern.matcher(resumeText);
        int maxYears = 0;
        
        while (matcher.find()) {
            try {
                int years = Integer.parseInt(matcher.group(1));
                maxYears = Math.max(maxYears, years);
            } catch (NumberFormatException e) {
                // Ignore invalid numbers
            }
        }
        
        // Only if we have clear work experience indicators, try to estimate from dates
        if (maxYears == 0 && detectWorkExperience(cleanText)) {
            maxYears = estimateYearsFromDates(resumeText);
        }
        
        return maxYears;
    }
    
    private int estimateYearsFromDates(String resumeText) {
        // Very strict: Only count date ranges that are DEFINITELY work-related
        String lowerText = resumeText.toLowerCase();
        
        // First, exclude if this looks like education-only resume
        if ((lowerText.contains("mca") || lowerText.contains("bachelor") || lowerText.contains("master")) &&
            !lowerText.contains("work") && !lowerText.contains("employ") && !lowerText.contains("job")) {
            return 0;
        }
        
        // Look for work-specific date patterns with job titles
        Pattern strictWorkPattern = Pattern.compile("(software engineer|software developer|web developer|java developer|python developer|full stack developer|backend developer|frontend developer|analyst|consultant|engineer).*?(20\\d{2})\\s*[-–]\\s*(20\\d{2}|present|current)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = strictWorkPattern.matcher(resumeText);
        int totalYears = 0;
        
        while (matcher.find()) {
            try {
                int startYear = Integer.parseInt(matcher.group(2));
                String endGroup = matcher.group(3);
                int endYear = endGroup.toLowerCase().contains("present") || 
                            endGroup.toLowerCase().contains("current") ? 
                            Calendar.getInstance().get(Calendar.YEAR) : 
                            Integer.parseInt(endGroup);
                
                // Only count reasonable work durations
                int duration = Math.max(0, endYear - startYear);
                if (duration >= 0 && duration <= 8) { // Max 8 years per job is reasonable
                    totalYears += duration;
                }
            } catch (NumberFormatException e) {
                // Ignore invalid dates
            }
        }
        
        // If no strict work patterns found, return 0 (don't guess from general dates)
        return totalYears;
    }
    
    private String determineExperienceLevel(int totalYears, String resumeText) {
        String cleanText = resumeText.toLowerCase();
        
        // Enhanced work experience detection
        boolean hasWorkExperience = detectWorkExperience(cleanText);
        boolean hasInternshipOnly = detectInternshipOnly(cleanText);
        boolean isStudent = detectStudent(cleanText);
        boolean hasProfessionalProjects = detectProfessionalProjects(cleanText);
        
        // Count actual job positions mentioned
        int jobPositionsCount = countJobPositions(cleanText);
        
        // Check for leadership indicators
        boolean hasLeadershipRole = LEADERSHIP_INDICATORS.stream()
            .anyMatch(indicator -> cleanText.contains(indicator.toLowerCase()));
        
        // Check for senior-level responsibilities
        boolean hasSeniorResponsibilities = SENIOR_RESPONSIBILITIES.stream()
            .anyMatch(responsibility -> cleanText.contains(responsibility.toLowerCase()));
        
        // Check for senior titles
        boolean hasSeniorTitle = SENIOR_INDICATORS.stream()
            .anyMatch(indicator -> cleanText.contains(indicator.toLowerCase()));
        
        // More nuanced classification
        if (isStudent && !hasWorkExperience && totalYears == 0) {
            return hasInternshipOnly ? "Student (Internship Experience)" : "Student";
        }
        
        if (!hasWorkExperience && !hasInternshipOnly && totalYears == 0) {
            return hasProfessionalProjects ? "Fresher (Project Experience)" : "Fresher";
        }
        
        // Senior level (8+ years OR 5+ with leadership/senior responsibilities)
        if (totalYears >= 8 || (totalYears >= 5 && (hasSeniorTitle || hasLeadershipRole || hasSeniorResponsibilities))) {
            if (totalYears >= 12 || hasLeadershipRole) {
                return "Senior (Leadership Level)";
            }
            return "Senior";
        }
        
        // Mid-level (3-7 years OR 2+ with multiple positions)
        if (totalYears >= 3 || (totalYears >= 2 && jobPositionsCount >= 2)) {
            return "Mid-Level";
        }
        
        // Junior level (1-2 years OR internship to full-time)
        if (totalYears >= 1 || (hasWorkExperience && !hasInternshipOnly)) {
            return "Junior";
        }
        
        // Entry level (internships, part-time, or < 1 year)
        if (hasInternshipOnly || (hasWorkExperience && totalYears < 1)) {
            return "Entry Level";
        }
        
        return "Fresher";
    }
    
    private boolean detectWorkExperience(String cleanText) {
        // Very strict work experience detection - must have CLEAR employment indicators
        
        // Strong employment keywords
        boolean hasStrongWorkKeywords = cleanText.contains("work experience") || 
                                       cleanText.contains("professional experience") ||
                                       cleanText.contains("employment history") ||
                                       cleanText.contains("employed at") ||
                                       cleanText.contains("worked at") ||
                                       cleanText.contains("working at") ||
                                       cleanText.contains("full-time") ||
                                       cleanText.contains("part-time") ||
                                       cleanText.contains("permanent") ||
                                       cleanText.contains("contract");
        
        // Job titles with company context
        boolean hasJobTitleWithCompany = (cleanText.contains("software engineer") || 
                                         cleanText.contains("software developer") ||
                                         cleanText.contains("web developer") ||
                                         cleanText.contains("full stack developer") ||
                                         cleanText.contains("backend developer") ||
                                         cleanText.contains("frontend developer") ||
                                         cleanText.contains("java developer") ||
                                         cleanText.contains("python developer")) &&
                                        (cleanText.contains(" at ") || 
                                         cleanText.contains("company") ||
                                         cleanText.contains("technologies") ||
                                         cleanText.contains("solutions") ||
                                         cleanText.contains("systems") ||
                                         cleanText.contains("inc") ||
                                         cleanText.contains("ltd") ||
                                         cleanText.contains("corp"));
        
        // Salary/compensation mentions
        boolean hasSalaryMention = cleanText.contains("salary") ||
                                  cleanText.contains("ctc") ||
                                  cleanText.contains("compensation") ||
                                  cleanText.contains("paid");
        
        // Professional responsibilities
        boolean hasProfessionalResponsibilities = cleanText.contains("responsibilities") ||
                                                 cleanText.contains("managed") ||
                                                 cleanText.contains("led team") ||
                                                 cleanText.contains("reporting to") ||
                                                 cleanText.contains("supervised");
        
        // Must have at least one strong indicator - not just project work
        return hasStrongWorkKeywords || hasJobTitleWithCompany || hasSalaryMention || hasProfessionalResponsibilities;
    }
    
    private boolean hasProfessionalDateRanges(String cleanText) {
        // Look for date ranges that are likely professional (not educational)
        Pattern workDatePattern = Pattern.compile("(software engineer|developer|analyst|engineer|consultant|specialist).*?(20\\d{2})\\s*[-–]\\s*(20\\d{2}|present|current)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = workDatePattern.matcher(cleanText);
        return matcher.find();
    }
    
    private boolean detectInternshipOnly(String cleanText) {
        return (cleanText.contains("intern") || cleanText.contains("internship")) &&
               !cleanText.contains("full-time") &&
               !cleanText.contains("permanent") &&
               !cleanText.contains("employee");
    }
    
    private boolean detectStudent(String cleanText) {
        return cleanText.contains("student") ||
               cleanText.contains("pursuing") ||
               cleanText.contains("currently studying") ||
               cleanText.contains("expected graduation") ||
               cleanText.contains("final year");
    }
    
    private boolean detectProfessionalProjects(String cleanText) {
        return cleanText.contains("project") &&
               (cleanText.contains("developed") ||
                cleanText.contains("built") ||
                cleanText.contains("created") ||
                cleanText.contains("implemented"));
    }
    
    private int countJobPositions(String cleanText) {
        String[] jobIndicators = {
            "software engineer", "developer", "analyst", "manager", "consultant",
            "associate", "specialist", "coordinator", "administrator", "architect"
        };
        
        int count = 0;
        for (String indicator : jobIndicators) {
            if (cleanText.contains(indicator)) {
                count++;
            }
        }
        return count;
    }
    
    private boolean hasDateRanges(String resumeText) {
        Pattern datePattern = Pattern.compile("(20\\d{2})\\s*[-–]\\s*(20\\d{2}|present|current)", Pattern.CASE_INSENSITIVE);
        return datePattern.matcher(resumeText).find();
    }
    
    private List<String> extractSkillHighlights(String skillsSection) {
        List<String> skills = skillExtractionService.extractSkills(skillsSection);
        return skills.stream().limit(10).collect(Collectors.toList());
    }
    
    private List<String> extractExperienceHighlights(String experienceSection) {
        return Arrays.stream(experienceSection.split("\n"))
            .filter(line -> line.trim().length() > 20)
            .filter(line -> line.contains("•") || line.contains("-") || 
                          EXPERIENCE_KEYWORDS.stream().anyMatch(kw -> line.toLowerCase().contains(kw)))
            .limit(5)
            .collect(Collectors.toList());
    }
    
    private List<String> extractProjectHighlights(String projectsSection) {
        return Arrays.stream(projectsSection.split("\n"))
            .filter(line -> line.trim().length() > 15)
            .limit(5)
            .collect(Collectors.toList());
    }
    
    private List<String> extractEducationHighlights(String educationSection) {
        return Arrays.stream(educationSection.split("\n"))
            .filter(line -> line.trim().length() > 10)
            .filter(line -> EDUCATION_KEYWORDS.stream().anyMatch(kw -> line.toLowerCase().contains(kw)))
            .limit(3)
            .collect(Collectors.toList());
    }
    
    private List<String> extractCertificationHighlights(String certificationsSection) {
        return Arrays.stream(certificationsSection.split("\n"))
            .filter(line -> line.trim().length() > 5)
            .limit(5)
            .collect(Collectors.toList());
    }
    
    private Map<String, Double> calculateSkillCategoryScores(String resumeText) {
        Map<String, Double> scores = new HashMap<>();
        List<String> allSkills = skillExtractionService.extractSkills(resumeText);
        
        for (Map.Entry<String, List<String>> category : SKILL_CATEGORIES.entrySet()) {
            long matchCount = allSkills.stream()
                .mapToLong(skill -> category.getValue().stream()
                    .mapToLong(catSkill -> skill.toLowerCase().contains(catSkill.toLowerCase()) ? 1 : 0)
                    .sum())
                .sum();
            
            double score = Math.min(1.0, (double) matchCount / category.getValue().size());
            scores.put(category.getKey(), score);
        }
        
        return scores;
    }
    
    private Map<String, Integer> calculateSkillCategoryCounts(String resumeText) {
        Map<String, Integer> counts = new HashMap<>();
        List<String> allSkills = skillExtractionService.extractSkills(resumeText);
        
        for (Map.Entry<String, List<String>> category : SKILL_CATEGORIES.entrySet()) {
            int count = (int) allSkills.stream()
                .mapToLong(skill -> category.getValue().stream()
                    .mapToLong(catSkill -> skill.toLowerCase().contains(catSkill.toLowerCase()) ? 1 : 0)
                    .sum())
                .sum();
            
            counts.put(category.getKey(), count);
        }
        
        return counts;
    }
    
    private double calculateInDemandSkillsBonus(List<String> skills) {
        List<String> inDemandSkills = Arrays.asList("react", "python", "aws", "kubernetes", "microservices", 
            "machine learning", "ai", "blockchain", "typescript", "graphql");
        
        long matchCount = skills.stream()
            .mapToLong(skill -> inDemandSkills.stream()
                .mapToLong(demand -> skill.toLowerCase().contains(demand.toLowerCase()) ? 1 : 0)
                .sum())
            .sum();
        
        return Math.min(0.2, matchCount / 10.0 * 0.2);
    }
    
    private boolean containsLeadershipKeywords(String resumeText) {
        List<String> leadershipKeywords = Arrays.asList("led", "managed", "coordinated", "supervised", 
            "mentored", "guided", "directed", "team lead", "project manager");
        
        return leadershipKeywords.stream()
            .anyMatch(keyword -> resumeText.toLowerCase().contains(keyword));
    }
    
    private boolean hasCareerProgression(String resumeText) {
        return SENIOR_INDICATORS.stream()
            .anyMatch(indicator -> resumeText.toLowerCase().contains(indicator)) &&
            resumeText.toLowerCase().contains("promoted");
    }
    
    private boolean hasComplexityIndicators(String projectsSection) {
        List<String> complexityKeywords = Arrays.asList("scalable", "distributed", "microservices", 
            "architecture", "system design", "performance", "optimization", "integration");
        
        return complexityKeywords.stream()
            .anyMatch(keyword -> projectsSection.toLowerCase().contains(keyword));
    }
    
    private String determineStrength(double skillsScore, double experienceScore, double projectsScore, double educationScore) {
        double maxScore = Math.max(Math.max(skillsScore, experienceScore), Math.max(projectsScore, educationScore));
        
        if (maxScore == skillsScore) return "Strong technical skills and diverse technology stack";
        if (maxScore == experienceScore) return "Extensive professional experience and leadership";
        if (maxScore == projectsScore) return "Impressive project portfolio and practical implementation skills";
        return "Strong educational background and foundational knowledge";
    }
    
    private String determineWeakness(double skillsScore, double experienceScore, double projectsScore, double educationScore) {
        double minScore = Math.min(Math.min(skillsScore, experienceScore), Math.min(projectsScore, educationScore));
        
        if (minScore == skillsScore) return "Limited technical skill diversity - consider expanding technology stack";
        if (minScore == experienceScore) return "Limited professional experience - focus on gaining more industry exposure";
        if (minScore == projectsScore) return "Few notable projects - consider building more practical applications";
        return "Educational background could be enhanced with additional certifications";
    }
    
    private List<String> generateImprovementSuggestions(double skillsScore, double experienceScore, double projectsScore, double educationScore) {
        List<String> suggestions = new ArrayList<>();
        
        if (skillsScore < 0.7) {
            suggestions.add("Expand technical skill set with modern frameworks and tools");
            suggestions.add("Consider learning cloud technologies (AWS, Azure, GCP)");
        }
        
        if (experienceScore < 0.6) {
            suggestions.add("Seek opportunities to lead projects or mentor junior developers");
            suggestions.add("Document measurable achievements and impact in previous roles");
        }
        
        if (projectsScore < 0.5) {
            suggestions.add("Build more substantial projects showcasing end-to-end development");
            suggestions.add("Contribute to open-source projects to demonstrate collaboration skills");
        }
        
        if (educationScore < 0.6) {
            suggestions.add("Consider pursuing relevant certifications in your field");
            suggestions.add("Attend workshops, bootcamps, or online courses to fill knowledge gaps");
        }
        
        return suggestions;
    }
    
    private List<String> generateResumeTips(String resumeText) {
        List<String> tips = new ArrayList<>();
        
        if (!resumeText.toLowerCase().contains("achieved") && !resumeText.toLowerCase().contains("improved")) {
            tips.add("Add quantifiable achievements and metrics to demonstrate impact");
        }
        
        if (resumeText.split("\n").length < 20) {
            tips.add("Expand resume content with more detailed descriptions of roles and projects");
        }
        
        tips.add("Use action verbs to start bullet points (developed, implemented, led, optimized)");
        tips.add("Include relevant keywords from job descriptions to pass ATS systems");
        tips.add("Highlight technical skills prominently in a dedicated section");
        
        return tips;
    }
    
    private List<String> generateLearningRecommendations(List<String> skills) {
        List<String> recommendations = new ArrayList<>();
        
        boolean hasBackend = skills.stream().anyMatch(s -> s.toLowerCase().contains("backend") || 
            s.toLowerCase().contains("spring") || s.toLowerCase().contains("express"));
        boolean hasFrontend = skills.stream().anyMatch(s -> s.toLowerCase().contains("react") || 
            s.toLowerCase().contains("angular") || s.toLowerCase().contains("vue"));
        boolean hasCloud = skills.stream().anyMatch(s -> s.toLowerCase().contains("aws") || 
            s.toLowerCase().contains("azure") || s.toLowerCase().contains("cloud"));
        
        if (!hasCloud) {
            recommendations.add("Learn cloud platforms (AWS, Azure, or GCP) for modern deployment");
        }
        
        if (!hasBackend) {
            recommendations.add("Develop backend development skills with frameworks like Spring Boot or Express.js");
        }
        
        if (!hasFrontend) {
            recommendations.add("Learn modern frontend frameworks like React, Angular, or Vue.js");
        }
        
        recommendations.add("Stay updated with DevOps practices including Docker and Kubernetes");
        recommendations.add("Consider learning data analysis tools like Python pandas or SQL");
        
        return recommendations;
    }
    
    private List<String> generateJDSuggestions(List<String> matchedSkills, List<String> missingSkills, String jdText) {
        List<String> suggestions = new ArrayList<>();
        
        if (!missingSkills.isEmpty()) {
            suggestions.add("Focus on developing these missing skills: " + 
                String.join(", ", missingSkills.subList(0, Math.min(5, missingSkills.size()))));
        }
        
        if (matchedSkills.size() > 0) {
            suggestions.add("Highlight your experience with " + String.join(", ", matchedSkills.subList(0, Math.min(3, matchedSkills.size()))) + " in your application");
        }
        
        suggestions.add("Tailor your resume to emphasize skills and experiences mentioned in the job description");
        suggestions.add("Prepare specific examples demonstrating your proficiency in the required technologies");
        
        return suggestions;
    }
    
    private String generateFitAssessment(double jdMatchPercentage, CandidateAnalysisDTO analysis) {
        if (jdMatchPercentage >= 80) {
            return "Excellent fit - Strong alignment with job requirements";
        } else if (jdMatchPercentage >= 60) {
            return "Good fit - Most requirements met with some gaps";
        } else if (jdMatchPercentage >= 40) {
            return "Moderate fit - Partially meets requirements, may need training";
        } else {
            return "Limited fit - Significant gaps in required skills";
        }
    }
    
    private List<String> extractProjects(String resumeText) {
        List<String> projects = new ArrayList<>();
        String projectsSection = extractSection(resumeText, "projects?");
        
        if (!projectsSection.isEmpty()) {
            String[] lines = projectsSection.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.length() > 10 && !line.toLowerCase().contains("project")) {
                    // Clean up project titles/descriptions
                    line = line.replaceAll("^[•\\-\\*\\d\\.\\s]+", "").trim();
                    if (line.length() > 5) {
                        projects.add(line);
                    }
                }
            }
        }
        
        return projects.subList(0, Math.min(projects.size(), 10)); // Limit to 10 projects
    }
    
    private List<String> extractHackathons(String resumeText) {
        List<String> hackathons = new ArrayList<>();
        String hackathonsSection = extractSection(resumeText, "(hackathons?|competitions?|contests?)");
        
        if (!hackathonsSection.isEmpty()) {
            String[] lines = hackathonsSection.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.length() > 5) {
                    // Clean up hackathon entries
                    line = line.replaceAll("^[•\\-\\*\\d\\.\\s]+", "").trim();
                    if (line.length() > 3) {
                        hackathons.add(line);
                    }
                }
            }
        }
        
        // Also search for hackathon mentions in projects or achievements
        String text = resumeText.toLowerCase();
        if (text.contains("hackathon") || text.contains("coding competition") || text.contains("programming contest")) {
            Pattern hackathonPattern = Pattern.compile("(\\w+\\s+)?hackathon|coding\\s+competition|programming\\s+contest", Pattern.CASE_INSENSITIVE);
            Matcher matcher = hackathonPattern.matcher(resumeText);
            while (matcher.find() && hackathons.size() < 5) {
                String match = matcher.group().trim();
                if (!hackathons.contains(match)) {
                    hackathons.add(match);
                }
            }
        }
        
        return hackathons;
    }
    
    private List<String> extractEducationList(String resumeText) {
        List<String> education = new ArrayList<>();
        String educationSection = extractSection(resumeText, "education");
        
        if (!educationSection.isEmpty()) {
            String[] lines = educationSection.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.length() > 10) {
                    // Clean up education entries
                    line = line.replaceAll("^[•\\-\\*\\d\\.\\s]+", "").trim();
                    if (line.length() > 5) {
                        education.add(line);
                    }
                }
            }
        }
        
        // Also look for degree mentions throughout the resume
        String text = resumeText.toLowerCase();
        for (String keyword : EDUCATION_KEYWORDS) {
            if (text.contains(keyword.toLowerCase())) {
                Pattern degreePattern = Pattern.compile("(" + keyword + "[^\\n\\.]{0,100})", Pattern.CASE_INSENSITIVE);
                Matcher matcher = degreePattern.matcher(resumeText);
                while (matcher.find() && education.size() < 5) {
                    String match = matcher.group().trim();
                    if (!education.stream().anyMatch(ed -> ed.toLowerCase().contains(match.toLowerCase()))) {
                        education.add(match);
                    }
                }
            }
        }
        
        return education.subList(0, Math.min(education.size(), 5)); // Limit to 5 education entries
    }
}
