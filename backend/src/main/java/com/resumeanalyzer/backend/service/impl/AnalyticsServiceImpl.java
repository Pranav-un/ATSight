package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.dto.AnalyticsResponse;
import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.repository.AnalysisRepository;
import com.resumeanalyzer.backend.repository.ResumeRepository;
import com.resumeanalyzer.backend.service.AnalyticsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {
    
    private static final Logger logger = LoggerFactory.getLogger(AnalyticsServiceImpl.class);
    
    private final AnalysisRepository analysisRepository;
    private final ResumeRepository resumeRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public AnalyticsResponse getUserAnalytics(User user, String timeRange) {
        logger.info("Generating analytics for user: {} with time range: {}", user.getEmail(), timeRange);
        
        LocalDateTime startDate = getStartDateForRange(timeRange);
        List<Analysis> analyses = analysisRepository.findByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, startDate);
        
        if (analyses.isEmpty()) {
            return createEmptyAnalytics();
        }
        
        return AnalyticsResponse.builder()
                .dashboardStats(calculateDashboardStats(user, analyses))
                .skillsDistribution(calculateSkillsDistribution(analyses))
                .topSkills(calculateTopSkills(analyses))
                .scoreHistory(buildScoreHistory(analyses))
                .industryInsights(calculateIndustryInsights(analyses))
                .monthlyTrends(calculateMonthlyTrends(analyses))
                .successRate(calculateSuccessRate(analyses))
                .totalSkillsAnalyzed(calculateTotalSkillsAnalyzed(analyses))
                .build();
    }
    
    @Override
    public AnalyticsResponse.DashboardStats getDashboardStats(User user) {
        List<Analysis> allAnalyses = analysisRepository.findByUserOrderByCreatedAtDesc(user);
        return calculateDashboardStats(user, allAnalyses);
    }
    
    private AnalyticsResponse.DashboardStats calculateDashboardStats(User user, List<Analysis> analyses) {
        int totalResumes = resumeRepository.countByUser(user);
        int totalAnalyses = analyses.size();
        
        double averageScore = analyses.isEmpty() ? 0.0 : 
            analyses.stream().mapToDouble(Analysis::getMatchScore).average().orElse(0.0) * 100;
        
        String lastAnalysisDate = analyses.isEmpty() ? null : 
            analyses.get(0).getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        
        // Calculate improvement rate (comparing last 5 vs previous 5 analyses)
        double improvementRate = calculateImprovementRate(analyses);
        
        // Calculate skills gained (unique skills from all analyses)
        int skillsGained = calculateSkillsGained(analyses);
        
        // Determine top industry
        String topIndustry = determineTopIndustry(analyses);
        
        return AnalyticsResponse.DashboardStats.builder()
                .totalAnalyses(totalAnalyses)
                .averageScore(averageScore)
                .totalResumes(totalResumes)
                .lastAnalysisDate(lastAnalysisDate)
                .improvementRate(improvementRate)
                .skillsGained(skillsGained)
                .topIndustry(topIndustry)
                .build();
    }
    
    private Map<String, Double> calculateSkillsDistribution(List<Analysis> analyses) {
        Map<String, Integer> categoryCount = new HashMap<>();
        
        for (Analysis analysis : analyses) {
            try {
                List<String> matchedSkills = objectMapper.readValue(analysis.getMatchedSkills(), List.class);
                
                for (String skill : matchedSkills) {
                    String category = categorizeSkill(skill);
                    categoryCount.merge(category, 1, Integer::sum);
                }
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse matched skills for analysis {}", analysis.getId());
            }
        }
        
        int total = categoryCount.values().stream().mapToInt(Integer::intValue).sum();
        
        return categoryCount.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    entry -> total > 0 ? (entry.getValue() * 100.0) / total : 0.0
                ));
    }
    
    private List<AnalyticsResponse.SkillFrequency> calculateTopSkills(List<Analysis> analyses) {
        Map<String, List<Double>> skillScores = new HashMap<>();
        
        for (Analysis analysis : analyses) {
            try {
                List<String> matchedSkills = objectMapper.readValue(analysis.getMatchedSkills(), List.class);
                double score = analysis.getMatchScore();
                
                for (String skill : matchedSkills) {
                    skillScores.computeIfAbsent(skill, k -> new ArrayList<>()).add(score);
                }
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse matched skills for analysis {}", analysis.getId());
            }
        }
        
        return skillScores.entrySet().stream()
                .map(entry -> AnalyticsResponse.SkillFrequency.builder()
                        .skill(entry.getKey())
                        .frequency(entry.getValue().size())
                        .averageMatch(entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0))
                        .build())
                .sorted((a, b) -> Integer.compare(b.getFrequency(), a.getFrequency()))
                .limit(10)
                .collect(Collectors.toList());
    }
    
    private List<AnalyticsResponse.ScoreHistory> buildScoreHistory(List<Analysis> analyses) {
        return analyses.stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .map(analysis -> AnalyticsResponse.ScoreHistory.builder()
                        .date(analysis.getCreatedAt().format(DateTimeFormatter.ofPattern("MM/dd")))
                        .score(analysis.getMatchScore())
                        .jobTitle(extractJobTitleFromAnalysis(analysis))
                        .matchLevel(determineMatchLevel(analysis.getMatchScore()))
                        .build())
                .collect(Collectors.toList());
    }
    
    private List<AnalyticsResponse.IndustryInsight> calculateIndustryInsights(List<Analysis> analyses) {
        Map<String, List<Analysis>> industryGroups = analyses.stream()
                .collect(Collectors.groupingBy(this::extractIndustryFromAnalysis));
        
        return industryGroups.entrySet().stream()
                .map(entry -> {
                    String industry = entry.getKey();
                    List<Analysis> industryAnalyses = entry.getValue();
                    
                    double avgScore = industryAnalyses.stream()
                            .mapToDouble(Analysis::getMatchScore)
                            .average().orElse(0.0);
                    
                    List<String> commonSkills = extractCommonSkills(industryAnalyses);
                    
                    return AnalyticsResponse.IndustryInsight.builder()
                            .industry(industry)
                            .analysisCount(industryAnalyses.size())
                            .averageScore(avgScore * 100)
                            .commonSkills(commonSkills)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getAnalysisCount(), a.getAnalysisCount()))
                .limit(5)
                .collect(Collectors.toList());
    }
    
    private Map<String, Integer> calculateMonthlyTrends(List<Analysis> analyses) {
        return analyses.stream()
                .collect(Collectors.groupingBy(
                    analysis -> analysis.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                    Collectors.summingInt(analysis -> 1)
                ));
    }
    
    private double calculateSuccessRate(List<Analysis> analyses) {
        long successfulAnalyses = analyses.stream()
                .mapToDouble(Analysis::getMatchScore)
                .filter(score -> score >= 0.6) // Consider 60%+ as successful
                .count();
        
        return analyses.isEmpty() ? 0.0 : (successfulAnalyses * 100.0) / analyses.size();
    }
    
    private int calculateTotalSkillsAnalyzed(List<Analysis> analyses) {
        Set<String> allSkills = new HashSet<>();
        
        for (Analysis analysis : analyses) {
            try {
                List<String> matchedSkills = objectMapper.readValue(analysis.getMatchedSkills(), List.class);
                List<String> missingSkills = objectMapper.readValue(analysis.getMissingSkills(), List.class);
                allSkills.addAll(matchedSkills);
                allSkills.addAll(missingSkills);
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse skills for analysis {}", analysis.getId());
            }
        }
        
        return allSkills.size();
    }
    
    // Helper methods
    private LocalDateTime getStartDateForRange(String timeRange) {
        LocalDateTime now = LocalDateTime.now();
        switch (timeRange.toLowerCase()) {
            case "7days": return now.minusDays(7);
            case "30days": return now.minusDays(30);
            case "3months": return now.minusMonths(3);
            case "6months": return now.minusMonths(6);
            case "1year": return now.minusYears(1);
            default: return now.minusMonths(1); // Default to last month
        }
    }
    
    private String categorizeSkill(String skill) {
        String lowerSkill = skill.toLowerCase();
        
        if (lowerSkill.matches(".*(java|python|javascript|typescript|c\\+\\+|c#|php|ruby|go|rust|swift|kotlin|scala).*")) {
            return "Programming Languages";
        } else if (lowerSkill.matches(".*(spring|django|react|angular|vue|node|express|flask|asp|laravel).*")) {
            return "Frameworks & Libraries";
        } else if (lowerSkill.matches(".*(mysql|postgresql|mongodb|redis|oracle|sql|dynamodb).*")) {
            return "Databases";
        } else if (lowerSkill.matches(".*(aws|azure|google cloud|docker|kubernetes|jenkins|gitlab|github).*")) {
            return "Cloud & DevOps";
        } else if (lowerSkill.matches(".*(git|maven|gradle|npm|yarn|webpack|babel|jest|junit|selenium).*")) {
            return "Tools & Technologies";
        } else {
            return "Other Skills";
        }
    }
    
    private String determineMatchLevel(double matchScore) {
        if (matchScore >= 0.8) return "Excellent";
        else if (matchScore >= 0.6) return "Good";
        else if (matchScore >= 0.4) return "Fair";
        else return "Poor";
    }
    
    private String extractJobTitleFromAnalysis(Analysis analysis) {
        // Extract job title from job description text
        return analysis.getJobDescription().getTitle() != null ? 
            analysis.getJobDescription().getTitle() : "Analysis";
    }
    
    private String extractIndustryFromAnalysis(Analysis analysis) {
        // Simple industry classification based on job description
        String jdText = analysis.getJobDescription().getText().toLowerCase();
        
        if (jdText.contains("software") || jdText.contains("developer") || jdText.contains("engineer")) {
            return "Technology";
        } else if (jdText.contains("finance") || jdText.contains("banking") || jdText.contains("investment")) {
            return "Finance";
        } else if (jdText.contains("healthcare") || jdText.contains("medical") || jdText.contains("hospital")) {
            return "Healthcare";
        } else if (jdText.contains("marketing") || jdText.contains("advertising") || jdText.contains("sales")) {
            return "Marketing";
        } else if (jdText.contains("education") || jdText.contains("teaching") || jdText.contains("academic")) {
            return "Education";
        } else {
            return "Other";
        }
    }
    
    private List<String> extractCommonSkills(List<Analysis> analyses) {
        Map<String, Integer> skillFrequency = new HashMap<>();
        
        for (Analysis analysis : analyses) {
            try {
                List<String> matchedSkills = objectMapper.readValue(analysis.getMatchedSkills(), List.class);
                for (String skill : matchedSkills) {
                    skillFrequency.merge(skill, 1, Integer::sum);
                }
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse matched skills for analysis {}", analysis.getId());
            }
        }
        
        return skillFrequency.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
    
    private double calculateImprovementRate(List<Analysis> analyses) {
        if (analyses.size() < 2) return 0.0;
        
        // Compare recent analyses with older ones
        List<Analysis> sortedAnalyses = analyses.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
        
        int recentCount = Math.min(5, sortedAnalyses.size() / 2);
        if (recentCount == 0) return 0.0;
        
        double recentAvg = sortedAnalyses.stream()
                .limit(recentCount)
                .mapToDouble(Analysis::getMatchScore)
                .average().orElse(0.0);
        
        double olderAvg = sortedAnalyses.stream()
                .skip(recentCount)
                .mapToDouble(Analysis::getMatchScore)
                .average().orElse(0.0);
        
        return olderAvg == 0 ? 0.0 : ((recentAvg - olderAvg) / olderAvg) * 100;
    }
    
    private int calculateSkillsGained(List<Analysis> analyses) {
        Set<String> allSkills = new HashSet<>();
        
        for (Analysis analysis : analyses) {
            try {
                List<String> matchedSkills = objectMapper.readValue(analysis.getMatchedSkills(), List.class);
                allSkills.addAll(matchedSkills);
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse matched skills for analysis {}", analysis.getId());
            }
        }
        
        return allSkills.size();
    }
    
    private String determineTopIndustry(List<Analysis> analyses) {
        Map<String, Long> industryCount = analyses.stream()
                .collect(Collectors.groupingBy(
                    this::extractIndustryFromAnalysis,
                    Collectors.counting()
                ));
        
        return industryCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Technology");
    }
    
    private AnalyticsResponse createEmptyAnalytics() {
        return AnalyticsResponse.builder()
                .dashboardStats(AnalyticsResponse.DashboardStats.builder()
                        .totalAnalyses(0)
                        .averageScore(0.0)
                        .totalResumes(0)
                        .lastAnalysisDate(null)
                        .improvementRate(0.0)
                        .skillsGained(0)
                        .topIndustry("N/A")
                        .build())
                .skillsDistribution(new HashMap<>())
                .topSkills(new ArrayList<>())
                .scoreHistory(new ArrayList<>())
                .industryInsights(new ArrayList<>())
                .monthlyTrends(new HashMap<>())
                .successRate(0.0)
                .totalSkillsAnalyzed(0)
                .build();
    }
}
