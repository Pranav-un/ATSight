package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.AnalysisResponse;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.EnhancedAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enhanced-analysis")
@RequiredArgsConstructor
public class EnhancedAnalysisController {
    private final EnhancedAnalysisService enhancedAnalysisService;

    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResponse> performDetailedAnalysis(
            @RequestBody AnalyzeRequest request,
            @AuthenticationPrincipal User user) {
        AnalysisResponse response = enhancedAnalysisService.performDetailedAnalysis(
                request.getResumeId(), 
                request.getJdId(), 
                user
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{analysisId}")
    public ResponseEntity<AnalysisResponse> getAnalysisById(
            @PathVariable Long analysisId,
            @AuthenticationPrincipal User user) {
        AnalysisResponse response = enhancedAnalysisService.getAnalysisById(analysisId, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/quick-match")
    public ResponseEntity<QuickMatchResponse> quickMatch(
            @RequestBody AnalyzeRequest request,
            @AuthenticationPrincipal User user) {
        AnalysisResponse fullAnalysis = enhancedAnalysisService.performDetailedAnalysis(
                request.getResumeId(), 
                request.getJdId(), 
                user
        );
        
        QuickMatchResponse quickResponse = QuickMatchResponse.builder()
                .matchPercentage(fullAnalysis.getMatchPercentage())
                .matchLevel(fullAnalysis.getMatchLevel())
                .matchedSkillsCount(fullAnalysis.getMatchedSkillsCount())
                .missingSkillsCount(fullAnalysis.getMissingSkillsCount())
                .topSuggestion(fullAnalysis.getImprovementSuggestions().isEmpty() ? 
                    "Analysis complete" : fullAnalysis.getImprovementSuggestions().get(0))
                .build();
        
        return ResponseEntity.ok(quickResponse);
    }

    // Request DTOs
    public static class AnalyzeRequest {
        private Long resumeId;
        private Long jdId;

        // Getters and setters
        public Long getResumeId() { return resumeId; }
        public void setResumeId(Long resumeId) { this.resumeId = resumeId; }
        public Long getJdId() { return jdId; }
        public void setJdId(Long jdId) { this.jdId = jdId; }
    }

    public static class QuickMatchResponse {
        private int matchPercentage;
        private String matchLevel;
        private int matchedSkillsCount;
        private int missingSkillsCount;
        private String topSuggestion;

        // Builder pattern
        public static QuickMatchResponseBuilder builder() {
            return new QuickMatchResponseBuilder();
        }

        public static class QuickMatchResponseBuilder {
            private QuickMatchResponse response = new QuickMatchResponse();

            public QuickMatchResponseBuilder matchPercentage(int matchPercentage) {
                response.matchPercentage = matchPercentage;
                return this;
            }

            public QuickMatchResponseBuilder matchLevel(String matchLevel) {
                response.matchLevel = matchLevel;
                return this;
            }

            public QuickMatchResponseBuilder matchedSkillsCount(int matchedSkillsCount) {
                response.matchedSkillsCount = matchedSkillsCount;
                return this;
            }

            public QuickMatchResponseBuilder missingSkillsCount(int missingSkillsCount) {
                response.missingSkillsCount = missingSkillsCount;
                return this;
            }

            public QuickMatchResponseBuilder topSuggestion(String topSuggestion) {
                response.topSuggestion = topSuggestion;
                return this;
            }

            public QuickMatchResponse build() {
                return response;
            }
        }

        // Getters
        public int getMatchPercentage() { return matchPercentage; }
        public String getMatchLevel() { return matchLevel; }
        public int getMatchedSkillsCount() { return matchedSkillsCount; }
        public int getMissingSkillsCount() { return missingSkillsCount; }
        public String getTopSuggestion() { return topSuggestion; }
    }
} 