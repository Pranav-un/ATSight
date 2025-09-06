package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.LeaderboardEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LeaderboardEntryRepository extends JpaRepository<LeaderboardEntry, Long> {
    
    @Query("SELECT le FROM LeaderboardEntry le " +
           "LEFT JOIN FETCH le.leaderboard l " +
           "LEFT JOIN FETCH l.recruiter " +
           "LEFT JOIN FETCH l.jobDescription " +
           "LEFT JOIN FETCH le.resume " +
           "WHERE le.id = :entryId")
    Optional<LeaderboardEntry> findByIdWithRelationships(@Param("entryId") Long entryId);
} 