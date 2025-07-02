package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private int totalAnalyses;
        private double averageScore;
        private int totalResumes;
        private String lastAnalysisDate;
        private double improvementRate;
        private int skillsGained;
        private String topIndustry;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillFrequency {
        private String skill;
        private int frequency;
        private double averageMatch;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreHistory {
        private String date;
        private double score;
        private String jobTitle;
        private String matchLevel;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustryInsight {
        private String industry;
        private int analysisCount;
        private double averageScore;
        private List<String> commonSkills;
    }
    
    private DashboardStats dashboardStats;
    private Map<String, Double> skillsDistribution;
    private List<SkillFrequency> topSkills;
    private List<ScoreHistory> scoreHistory;
    private List<IndustryInsight> industryInsights;
    private Map<String, Integer> monthlyTrends;
    private double successRate;
    private int totalSkillsAnalyzed;
}
