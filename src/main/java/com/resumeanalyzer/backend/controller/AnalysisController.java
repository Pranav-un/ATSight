package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.AnalysisService;
import com.resumeanalyzer.backend.service.EnhancedAnalysisService;
import com.resumeanalyzer.backend.dto.AnalysisResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.resumeanalyzer.backend.dto.AnalysisHistoryDTO;
import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.Resume;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.resumeanalyzer.backend.dto.AnalysisTrendDTO;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {
    private final AnalysisService analysisService;
    private final EnhancedAnalysisService enhancedAnalysisService;

    @PostMapping("/analyze")
    public Analysis analyze(@RequestBody AnalyzeRequest request, @AuthenticationPrincipal User user) {
        return analysisService.analyze(request.getResumeId(), request.getJdId(), user);
    }

    @PostMapping("/analyze-enhanced")
    public Object analyzeEnhanced(@RequestBody AnalyzeRequest request, @AuthenticationPrincipal User user) {
        return enhancedAnalysisService.performDetailedAnalysis(request.getResumeId(), request.getJdId(), user);
    }

    @GetMapping("/history")
    public List<AnalysisResponse> getAnalysisHistory(@AuthenticationPrincipal User user) {
        return analysisService.getAnalysisHistory(user).stream().map(analysis -> {
            Resume resume = analysis.getResume();
            JobDescription jd = analysis.getJobDescription();
            
            // Convert old Analysis entity to new AnalysisResponse format
            return AnalysisResponse.builder()
                    .id(analysis.getId())
                    .resumeId(resume.getId())
                    .resumeFileName(resume.getFileName())
                    .jobDescriptionId(jd.getId())
                    .jobTitle(jd.getTitle())
                    .overallMatchScore(analysis.getMatchScore())
                    .matchPercentage((int) Math.round(analysis.getMatchScore() * 100))
                    .matchLevel(getMatchLevel(analysis.getMatchScore()))
                    .matchedSkills(parseSkillsJson(analysis.getMatchedSkills()))
                    .missingSkills(parseSkillsJson(analysis.getMissingSkills()))
                    .totalRequiredSkills(parseSkillsJson(analysis.getMatchedSkills()).size() + parseSkillsJson(analysis.getMissingSkills()).size())
                    .matchedSkillsCount(parseSkillsJson(analysis.getMatchedSkills()).size())
                    .missingSkillsCount(parseSkillsJson(analysis.getMissingSkills()).size())
                    .categoryScores(Map.of()) // Empty for old data
                    .skillCategories(List.of()) // Empty for old data
                    .improvementSuggestions(analysis.getSuggestions() != null ? List.of(analysis.getSuggestions()) : List.of())
                    .resumeTips(List.of()) // Empty for old data
                    .learningRecommendations(List.of()) // Empty for old data
                    .analyzedAt(analysis.getCreatedAt())
                    .analysisDuration("N/A") // Not available for old data
                    .build();
        }).collect(Collectors.toList());
    }
    
    private String getMatchLevel(double score) {
        if (score >= 0.8) return "Excellent";
        if (score >= 0.6) return "Good";
        if (score >= 0.4) return "Fair";
        return "Poor";
    }
    
    private List<String> parseSkillsJson(String skillsJson) {
        if (skillsJson == null || skillsJson.trim().isEmpty()) {
            return List.of();
        }
        try {
            // Simple JSON array parsing - assuming format like ["skill1", "skill2"]
            skillsJson = skillsJson.trim();
            if (skillsJson.startsWith("[") && skillsJson.endsWith("]")) {
                skillsJson = skillsJson.substring(1, skillsJson.length() - 1);
                if (skillsJson.trim().isEmpty()) {
                    return List.of();
                }
                return List.of(skillsJson.split(",")).stream()
                        .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
            }
            return List.of(skillsJson); // Fallback: treat as single skill
        } catch (Exception e) {
            return List.of(); // Return empty list if parsing fails
        }
    }

    @GetMapping("/trends")
    public List<AnalysisTrendDTO> getAnalysisTrends(@AuthenticationPrincipal User user) {
        return analysisService.getAnalysisTrends(user);
    }

    @Data
    public static class AnalyzeRequest {
        private Long resumeId;
        private Long jdId;
    }
} 