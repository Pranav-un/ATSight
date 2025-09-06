package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.AnalyticsResponse;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.AnalyticsService;
import com.resumeanalyzer.backend.service.UserService;
import com.resumeanalyzer.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    private final UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsResponse.DashboardStats> getDashboardStats(
            HttpServletRequest httpRequest) {
        try {
            // Extract JWT token and validate
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String email = jwtUtil.extractUsername(token);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            AnalyticsResponse.DashboardStats stats = analyticsService.getDashboardStats(user);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/full")
    public ResponseEntity<AnalyticsResponse> getFullAnalytics(
            HttpServletRequest httpRequest,
            @RequestParam(defaultValue = "30days") String timeRange) {
        try {
            // Extract JWT token and validate
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String email = jwtUtil.extractUsername(token);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            AnalyticsResponse analytics = analyticsService.getUserAnalytics(user, timeRange);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
