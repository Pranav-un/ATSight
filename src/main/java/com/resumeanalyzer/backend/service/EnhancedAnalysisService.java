package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.dto.AnalysisResponse;
import com.resumeanalyzer.backend.entity.User;

public interface EnhancedAnalysisService {
    AnalysisResponse performDetailedAnalysis(Long resumeId, Long jdId, User user);
    AnalysisResponse getAnalysisById(Long analysisId, User user);
    double calculateSkillMatchScore(java.util.List<String> resumeSkills, java.util.List<String> jdSkills);
    java.util.List<String> generateImprovementSuggestions(java.util.List<String> missingSkills, double matchScore);
    java.util.List<String> generateResumeTips(double matchScore, int missingSkillsCount);
    java.util.List<String> generateResumeTips(double matchScore, int missingSkillsCount, java.util.List<String> missingSkills, String jobTitle);
    java.util.List<String> generateLearningRecommendations(java.util.List<String> missingSkills);
} 