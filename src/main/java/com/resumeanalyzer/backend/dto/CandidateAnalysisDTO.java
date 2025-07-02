package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class CandidateAnalysisDTO {
    private double overallScore;
    private double skillsScore;
    private double experienceScore;
    private double educationScore;
    private double projectsScore;
    
    // Detailed breakdowns
    @Builder.Default
    private List<String> skills = new ArrayList<>(); // All candidate skills
    @Builder.Default
    private List<String> projects = new ArrayList<>(); // All candidate projects  
    @Builder.Default
    private List<String> hackathons = new ArrayList<>(); // All candidate hackathons
    @Builder.Default
    private List<String> education = new ArrayList<>(); // All candidate education
    @Builder.Default
    private List<String> suggestions = new ArrayList<>(); // All improvement suggestions
    
    @Builder.Default
    private List<String> matchedSkills = new ArrayList<>();
    @Builder.Default
    private List<String> missingSkills = new ArrayList<>();
    @Builder.Default
    private List<String> suggestedSkills = new ArrayList<>();
    @Builder.Default
    private List<String> experienceHighlights = new ArrayList<>();
    @Builder.Default
    private List<String> projectHighlights = new ArrayList<>();
    @Builder.Default
    private List<String> educationHighlights = new ArrayList<>();
    @Builder.Default
    private List<String> certificationHighlights = new ArrayList<>();
    
    // JD-specific analysis (when JD is provided)
    private Integer totalYearsExperience;
    private String experienceLevel; // Junior, Mid, Senior
    @Builder.Default
    private List<String> keywordMatches = new ArrayList<>();
    private double jdMatchPercentage;
    
    // Improvement suggestions
    @Builder.Default
    private List<String> improvementSuggestions = new ArrayList<>();
    @Builder.Default
    private List<String> resumeTips = new ArrayList<>();
    @Builder.Default
    private List<String> learningRecommendations = new ArrayList<>();
    
    // Category-wise scores
    @Builder.Default
    private Map<String, Double> skillCategoryScores = new HashMap<>();
    @Builder.Default
    private Map<String, Integer> skillCategoryCounts = new HashMap<>();
    
    // Additional insights
    private String candidateStrength;
    private String candidateWeakness;
    private String fitAssessment;
    
    // Parsed sections
    private String extractedSkills;
    private String extractedExperience;
    private String extractedProjects;
    private String extractedEducation;
    private String extractedCertifications;
    
    private boolean hasJD;
}
