package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;

public interface LLMAnalysisService {
    /**
     * Enhances resume analysis using LLM
     */
    CandidateAnalysisDTO enhanceAnalysisWithLLM(String resumeText, String jobDescription);
    
    /**
     * Analyzes resume without job description using LLM
     */
    CandidateAnalysisDTO analyzeResumeWithLLM(String resumeText);
    
    /**
     * Extracts candidate name using LLM
     */
    String extractCandidateNameWithLLM(String resumeText);
    
    /**
     * Checks if LLM service is available
     */
    boolean isLLMAvailable();
}
