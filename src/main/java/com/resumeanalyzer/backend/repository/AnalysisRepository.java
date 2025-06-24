package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
 
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findAllByUserOrderByCreatedAtDesc(com.resumeanalyzer.backend.entity.User user);
} 