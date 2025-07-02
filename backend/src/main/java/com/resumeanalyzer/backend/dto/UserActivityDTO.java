package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class UserActivityDTO {
    private List<ResumeSummary> resumes;
    private List<JobDescriptionSummary> jobDescriptions;
    private List<AnalysisSummary> analyses;

    @Data
    @AllArgsConstructor
    public static class ResumeSummary {
        private Long id;
        private String fileName;
        private String uploadDate;
    }

    @Data
    @AllArgsConstructor
    public static class JobDescriptionSummary {
        private Long id;
        private String title;
        private String uploadDate;
    }

    @Data
    @AllArgsConstructor
    public static class AnalysisSummary {
        private Long id;
        private String resumeFileName;
        private String jobTitle;
        private String analyzedAt;
        private double matchScore;
    }
} 