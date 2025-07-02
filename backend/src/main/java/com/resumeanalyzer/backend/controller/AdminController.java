package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.UserSummaryDTO;
import com.resumeanalyzer.backend.dto.PlatformAnalyticsDTO;
import com.resumeanalyzer.backend.dto.UserActivityDTO;
import com.resumeanalyzer.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{userId}/deactivate")
    public ResponseEntity<UserSummaryDTO> deactivateUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.setUserActiveStatus(userId, false));
    }

    @PatchMapping("/users/{userId}/activate")
    public ResponseEntity<UserSummaryDTO> activateUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.setUserActiveStatus(userId, true));
    }

    @GetMapping("/analytics")
    public ResponseEntity<PlatformAnalyticsDTO> getPlatformAnalytics() {
        return ResponseEntity.ok(adminService.getPlatformAnalytics());
    }

    @GetMapping("/users/{userId}/activity")
    public ResponseEntity<UserActivityDTO> getUserActivity(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserActivity(userId));
    }
} 