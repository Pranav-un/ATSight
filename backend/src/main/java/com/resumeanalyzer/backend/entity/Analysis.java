package com.resumeanalyzer.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Analysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id", nullable = false)
    private JobDescription jobDescription;

    private double matchScore;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String matchedSkills; // JSON array

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String missingSkills; // JSON array

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String suggestions;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String resumeTips; // JSON array

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String learningRecommendations; // JSON array

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 