package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlatformAnalyticsDTO {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long jobseekers;
    private long recruiters;
    private long admins;
    private long totalResumes;
    private long totalJobDescriptions;
    private long totalAnalyses;
} 