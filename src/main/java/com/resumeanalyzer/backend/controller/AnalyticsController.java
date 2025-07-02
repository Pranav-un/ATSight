package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.AnalyticsResponse;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsResponse.DashboardStats> getDashboardStats(
            @AuthenticationPrincipal User user) {
        
        AnalyticsResponse.DashboardStats stats = analyticsService.getDashboardStats(user);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/full")
    public ResponseEntity<AnalyticsResponse> getFullAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "30days") String timeRange) {
        
        AnalyticsResponse analytics = analyticsService.getUserAnalytics(user, timeRange);
        return ResponseEntity.ok(analytics);
    }
}
