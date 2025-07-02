package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import java.util.List;
import com.resumeanalyzer.backend.dto.AnalysisTrendDTO;

public interface AnalysisService {
    Analysis analyze(Long resumeId, Long jdId, User user);
    List<Analysis> getAnalysisHistory(User user);
    List<AnalysisTrendDTO> getAnalysisTrends(User user);
} 