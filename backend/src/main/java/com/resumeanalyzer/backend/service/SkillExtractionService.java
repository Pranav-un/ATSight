package com.resumeanalyzer.backend.service;

import java.util.List;

public interface SkillExtractionService {
    List<String> extractSkills(String text);
    double computeSimilarity(String text1, String text2);
    void testAPI();
} 