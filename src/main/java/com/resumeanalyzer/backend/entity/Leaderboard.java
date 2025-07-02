package com.resumeanalyzer.backend.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "leaderboards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Leaderboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_id", nullable = false)
    private User recruiter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id")
    private JobDescription jobDescription; // Nullable

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "leaderboard", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<LeaderboardEntry> entries;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 