package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResponse {
    private Long id;
    private Long resumeId;
    private Long jobDescriptionId;
    private String resumeFileName;
    private String jobTitle;
    
    // Match Analysis
    private double overallMatchScore;
    private int matchPercentage;
    private String matchLevel; // Excellent, Good, Fair, Poor
    
    // Skills Analysis
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private int totalRequiredSkills;
    private int matchedSkillsCount;
    private int missingSkillsCount;
    
    // Detailed Breakdown
    private Map<String, Double> categoryScores; // e.g., "Technical Skills": 0.85, "Soft Skills": 0.60
    private List<SkillCategory> skillCategories;
    
    // Suggestions
    private List<String> improvementSuggestions;
    private List<String> resumeTips;
    private List<String> learningRecommendations;
    
    // Metadata
    private LocalDateTime analyzedAt;
    private String analysisDuration;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillCategory {
        private String categoryName;
        private List<String> skills;
        private double matchScore;
        private int requiredCount;
        private int matchedCount;
        private List<String> missingSkills;
    }
} 