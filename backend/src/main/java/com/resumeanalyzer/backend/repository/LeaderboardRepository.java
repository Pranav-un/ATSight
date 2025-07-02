package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Leaderboard;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {
    List<Leaderboard> findByRecruiterOrderByCreatedAtDesc(User recruiter);
} 