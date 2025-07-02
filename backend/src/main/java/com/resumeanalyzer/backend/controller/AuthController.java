package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.AuthRequest;
import com.resumeanalyzer.backend.dto.AuthResponse;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody AuthRequest request, @RequestParam User.Role role) {
        User user = userService.registerUser(request, role);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        AuthResponse response = userService.authenticateUser(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<String> testAuth() {
        return ResponseEntity.ok("Authentication successful");
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user);
    }
}