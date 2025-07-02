package com.resumeanalyzer.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeanalyzer.backend.entity.*;
import com.resumeanalyzer.backend.repository.*;
import com.resumeanalyzer.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.resumeanalyzer.backend.dto.AnalysisTrendDTO;
import com.resumeanalyzer.backend.dto.TrendPointDTO;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisServiceImpl implements AnalysisService {
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final AnalysisRepository analysisRepository;
    private final SkillExtractionService skillExtractionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Analysis analyze(Long resumeId, Long jdId, User user) {
        Resume resume = resumeRepository.findById(resumeId).orElseThrow();
        JobDescription jd = jobDescriptionRepository.findById(jdId).orElseThrow();
        List<String> resumeSkills = skillExtractionService.extractSkills(resume.getParsedText());
        List<String> jdSkills = skillExtractionService.extractSkills(jd.getText());
        Set<String> matched = new HashSet<>(resumeSkills);
        matched.retainAll(jdSkills);
        Set<String> missing = new HashSet<>(jdSkills);
        missing.removeAll(resumeSkills);
        double matchScore = skillExtractionService.computeSimilarity(resume.getParsedText(), jd.getText());
        String suggestions = missing.isEmpty() ? "Great match!" : "Consider adding: " + String.join(", ", missing);
        try {
            Analysis analysis = Analysis.builder()
                    .user(user)
                    .resume(resume)
                    .jobDescription(jd)
                    .matchScore(matchScore)
                    .matchedSkills(objectMapper.writeValueAsString(matched))
                    .missingSkills(objectMapper.writeValueAsString(missing))
                    .suggestions(suggestions)
                    .build();
            return analysisRepository.save(analysis);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize skills", e);
        }
    }

    @Override
    public List<Analysis> getAnalysisHistory(User user) {
        return analysisRepository.findAllByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public List<AnalysisTrendDTO> getAnalysisTrends(User user) {
        List<Analysis> analyses = analysisRepository.findAllByUserOrderByCreatedAtDesc(user);
        // Group by JobDescription
        Map<JobDescription, List<Analysis>> grouped = analyses.stream()
            .collect(Collectors.groupingBy(Analysis::getJobDescription));
        return grouped.entrySet().stream().map(entry -> {
            JobDescription jd = entry.getKey();
            List<TrendPointDTO> trend = entry.getValue().stream()
                .sorted((a, b) -> a.getResume().getUploadDate().compareTo(b.getResume().getUploadDate()))
                .map(analysis -> TrendPointDTO.builder()
                    .resumeId(analysis.getResume().getId())
                    .resumeFileName(analysis.getResume().getFileName())
                    .matchScore(analysis.getMatchScore())
                    .createdAt(analysis.getCreatedAt())
                    .build())
                .collect(Collectors.toList());
            return AnalysisTrendDTO.builder()
                .jobDescriptionId(jd.getId())
                .jobTitle(jd.getTitle())
                .trend(trend)
                .build();
        }).collect(Collectors.toList());
    }
} 