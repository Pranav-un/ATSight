package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.AnalysisResponse;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.EnhancedAnalysisService;
import com.resumeanalyzer.backend.service.UserService;
import com.resumeanalyzer.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/enhanced-analysis")
@RequiredArgsConstructor
public class EnhancedAnalysisController {
    private final EnhancedAnalysisService enhancedAnalysisService;
    private final UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/analyze")
    public ResponseEntity<AnalysisResponse> performDetailedAnalysis(
            @RequestBody AnalyzeRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Extract JWT token and validate
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String email = jwtUtil.extractUsername(token);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            AnalysisResponse response = enhancedAnalysisService.performDetailedAnalysis(
                    request.getResumeId(), 
                    request.getJdId(), 
                    user
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{analysisId}")
    public ResponseEntity<AnalysisResponse> getAnalysisById(
            @PathVariable Long analysisId,
            HttpServletRequest httpRequest) {
        try {
            // Extract JWT token and validate
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String email = jwtUtil.extractUsername(token);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            AnalysisResponse response = enhancedAnalysisService.getAnalysisById(analysisId, user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/quick-match")
    public ResponseEntity<QuickMatchResponse> quickMatch(
            @RequestBody AnalyzeRequest request,
            HttpServletRequest httpRequest) {
        try {
            // Extract JWT token and validate
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String email = jwtUtil.extractUsername(token);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

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
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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