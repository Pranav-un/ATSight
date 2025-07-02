package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
 
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findAllByUserOrderByCreatedAtDesc(User user);
    List<Analysis> findByUserOrderByCreatedAtDesc(User user);
    List<Analysis> findByUserAndCreatedAtAfterOrderByCreatedAtDesc(User user, LocalDateTime startDate);
} 