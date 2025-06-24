package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendPointDTO {
    private Long resumeId;
    private String resumeFileName;
    private double matchScore;
    private LocalDateTime createdAt;
} 