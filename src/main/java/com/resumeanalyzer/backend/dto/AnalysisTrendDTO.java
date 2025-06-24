package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisTrendDTO {
    private Long jobDescriptionId;
    private String jobTitle;
    private List<TrendPointDTO> trend;
} 