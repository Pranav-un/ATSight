package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Analysis;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
 
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    
    @Query("SELECT a FROM Analysis a " +
           "JOIN FETCH a.resume " +
           "JOIN FETCH a.jobDescription " +
           "WHERE a.user = :user " +
           "ORDER BY a.createdAt DESC")
    List<Analysis> findAllByUserOrderByCreatedAtDesc(@Param("user") User user);
    
    @Query("SELECT a FROM Analysis a " +
           "JOIN FETCH a.resume " +
           "JOIN FETCH a.jobDescription " +
           "WHERE a.user = :user " +
           "ORDER BY a.createdAt DESC")
    List<Analysis> findByUserOrderByCreatedAtDesc(@Param("user") User user);
    
    @Query("SELECT a FROM Analysis a " +
           "JOIN FETCH a.resume " +
           "JOIN FETCH a.jobDescription " +
           "WHERE a.user = :user AND a.createdAt > :startDate " +
           "ORDER BY a.createdAt DESC")
    List<Analysis> findByUserAndCreatedAtAfterOrderByCreatedAtDesc(@Param("user") User user, @Param("startDate") LocalDateTime startDate);
} 