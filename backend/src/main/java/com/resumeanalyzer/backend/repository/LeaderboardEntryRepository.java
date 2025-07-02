package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
 
public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {
} 