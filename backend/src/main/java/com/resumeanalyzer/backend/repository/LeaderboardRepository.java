package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Leaderboard;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {
    List<Leaderboard> findByRecruiterOrderByCreatedAtDesc(User recruiter);
    
    @Query("SELECT DISTINCT l FROM Leaderboard l " +
           "LEFT JOIN FETCH l.recruiter " +
           "LEFT JOIN FETCH l.jobDescription " +
           "LEFT JOIN FETCH l.entries e " +
           "LEFT JOIN FETCH e.resume " +
           "WHERE l.recruiter = :recruiter " +
           "ORDER BY l.createdAt DESC")
    List<Leaderboard> findByRecruiterWithDetailsOrderByCreatedAtDesc(@Param("recruiter") User recruiter);
} 