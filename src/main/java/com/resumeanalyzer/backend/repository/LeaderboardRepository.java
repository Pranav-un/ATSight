package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Leaderboard;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {
} 