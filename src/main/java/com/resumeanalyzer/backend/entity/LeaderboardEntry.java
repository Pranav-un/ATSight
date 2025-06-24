package com.resumeanalyzer.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leaderboard_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leaderboard_id", nullable = false)
    private Leaderboard leaderboard;

    private String candidateName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    private Double matchScore; // Nullable if no JD

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String skills;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String experience;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String projects;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String hackathons;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 