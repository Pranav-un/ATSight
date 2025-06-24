package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.AnalysisService;
import com.resumeanalyzer.backend.service.EnhancedAnalysisService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.resumeanalyzer.backend.dto.AnalysisHistoryDTO;
import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.Resume;
import java.util.List;
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
    public List<AnalysisHistoryDTO> getAnalysisHistory(@AuthenticationPrincipal User user) {
        return analysisService.getAnalysisHistory(user).stream().map(analysis -> {
            Resume resume = analysis.getResume();
            JobDescription jd = analysis.getJobDescription();
            return AnalysisHistoryDTO.builder()
                    .id(analysis.getId())
                    .resumeId(resume.getId())
                    .resumeFileName(resume.getFileName())
                    .jobDescriptionId(jd.getId())
                    .jobTitle(jd.getTitle())
                    .matchScore(analysis.getMatchScore())
                    .createdAt(analysis.getCreatedAt())
                    .suggestions(analysis.getSuggestions())
                    .build();
        }).collect(Collectors.toList());
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