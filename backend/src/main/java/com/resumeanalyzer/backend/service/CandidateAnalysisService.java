package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;

public interface CandidateAnalysisService {
    CandidateAnalysisDTO analyzeWithJobDescription(String resumeText, String jdText);
    CandidateAnalysisDTO analyzeWithoutJobDescription(String resumeText);
    double calculateExperienceScore(String resumeText);
    double calculateSkillsScore(String resumeText);
    double calculateEducationScore(String resumeText);
    double calculateProjectsScore(String resumeText);
}
