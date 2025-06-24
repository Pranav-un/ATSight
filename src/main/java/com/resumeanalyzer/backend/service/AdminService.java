package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.dto.UserSummaryDTO;
import com.resumeanalyzer.backend.dto.PlatformAnalyticsDTO;
import com.resumeanalyzer.backend.dto.UserActivityDTO;
import java.util.List;

public interface AdminService {
    List<UserSummaryDTO> getAllUsers();
    UserSummaryDTO setUserActiveStatus(Long userId, boolean active);
    PlatformAnalyticsDTO getPlatformAnalytics();
    UserActivityDTO getUserActivity(Long userId);
} 