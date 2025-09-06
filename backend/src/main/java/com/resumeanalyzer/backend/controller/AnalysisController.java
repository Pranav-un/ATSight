package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.AnalysisService;
import com.resumeanalyzer.backend.service.EnhancedAnalysisService;
import com.resumeanalyzer.backend.service.UserService;
import com.resumeanalyzer.backend.util.JwtUtil;
import com.resumeanalyzer.backend.dto.AnalysisResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
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
    private final UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/analyze")
    public ResponseEntity<Analysis> analyze(@RequestBody AnalyzeRequest request, HttpServletRequest httpRequest) {
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

            Analysis result = analysisService.analyze(request.getResumeId(), request.getJdId(), user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/analyze-enhanced")
    public ResponseEntity<Object> analyzeEnhanced(@RequestBody AnalyzeRequest request, HttpServletRequest httpRequest) {
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

            Object result = enhancedAnalysisService.performDetailedAnalysis(request.getResumeId(), request.getJdId(), user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResponse>> getAnalysisHistory(HttpServletRequest httpRequest) {
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

            List<AnalysisResponse> result = analysisService.getAnalysisHistory(user).stream().map(analysis -> {
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
                        .resumeTips(parseSkillsJson(analysis.getResumeTips()))
                        .learningRecommendations(parseSkillsJson(analysis.getLearningRecommendations()))
                        .analyzedAt(analysis.getCreatedAt())
                        .analysisDuration("N/A") // Not available for old data
                        .build();
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
    public ResponseEntity<List<AnalysisTrendDTO>> getAnalysisTrends(HttpServletRequest httpRequest) {
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

            List<AnalysisTrendDTO> result = analysisService.getAnalysisTrends(user);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Data
    public static class AnalyzeRequest {
        private Long resumeId;
        private Long jdId;
    }
} 