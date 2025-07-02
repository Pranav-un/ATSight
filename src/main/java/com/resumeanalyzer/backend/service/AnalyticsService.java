package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.dto.AnalyticsResponse;
import com.resumeanalyzer.backend.entity.User;

public interface AnalyticsService {
    AnalyticsResponse getUserAnalytics(User user, String timeRange);
    AnalyticsResponse.DashboardStats getDashboardStats(User user);
}
