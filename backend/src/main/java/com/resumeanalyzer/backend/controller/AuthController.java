package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.dto.*;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.UserService;
import com.resumeanalyzer.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

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

    @PostMapping("/test-login")
    public ResponseEntity<AuthResponse> testLogin(@RequestBody(required = false) AuthRequest request) {
        System.out.println("=== TEST LOGIN REQUEST ===");
        
        // Use default credentials if not provided
        AuthRequest loginRequest = request;
        if (loginRequest == null) {
            loginRequest = new AuthRequest();
            loginRequest.setEmail("test.recruiter@example.com");
            loginRequest.setPassword("password");
        }
        
        // If email is missing, use default
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            loginRequest.setEmail("test.recruiter@example.com");
        }
        
        // If password is missing, use default
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            loginRequest.setPassword("password");
        }
        
        System.out.println("Test login attempt for email: " + loginRequest.getEmail());
        
        try {
            // First try to authenticate with existing credentials
            AuthResponse response = userService.authenticateUser(loginRequest);
            System.out.println("Test login successful for: " + loginRequest.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // If authentication fails, check if it's because user doesn't exist
            try {
                // Try to register first (this will fail if user exists)
                User newUser = userService.registerUser(loginRequest, User.Role.RECRUITER);
                System.out.println("Registered new test user: " + newUser.getEmail());
                // Now try to authenticate the new user
                AuthResponse response = userService.authenticateUser(loginRequest);
                return ResponseEntity.ok(response);
            } catch (Exception registerError) {
                if (registerError.getMessage().contains("Email already registered")) {
                    // User exists but authentication failed - this likely means wrong password
                    // For test login, let's just create a response with a valid user
                    try {
                        User existingUser = userService.findByEmail(loginRequest.getEmail())
                                .orElseThrow(() -> new RuntimeException("User exists but couldn't be found"));
                        
                        String token = jwtUtil.generateToken(existingUser);
                        
                        AuthResponse response = new AuthResponse(token, existingUser);
                        
                        System.out.println("Test login successful for existing user: " + existingUser.getEmail());
                        return ResponseEntity.ok(response);
                    } catch (Exception findError) {
                        System.err.println("Failed to find existing user: " + findError.getMessage());
                        throw new RuntimeException("Test login failed: " + findError.getMessage());
                    }
                } else {
                    System.err.println("Failed to register test user: " + registerError.getMessage());
                    throw new RuntimeException("Test login failed: " + registerError.getMessage());
                }
            }
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            userService.initiatePasswordReset(request.getEmail(), "http://localhost:3000");
            return ResponseEntity.ok(new ApiResponse("Password reset email sent successfully", true));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse("If the email exists, a password reset link has been sent", true));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            userService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(new ApiResponse("Password reset successfully", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(e.getMessage(), false));
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<ApiResponse> testEmail() {
        try {
            System.out.println("=== EMAIL TEST STARTING ===");
            System.out.println("Testing email to: pranav.24pmc141@mariancollege.org");
            
            // Direct test of email service
            userService.initiatePasswordReset("pranav.24pmc141@mariancollege.org", "http://localhost:3000");
            
            System.out.println("=== EMAIL TEST COMPLETED SUCCESSFULLY ===");
            return ResponseEntity.ok(new ApiResponse("Test email sent successfully", true));
        } catch (Exception e) {
            System.err.println("=== EMAIL TEST FAILED ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ApiResponse("Email test failed: " + e.getMessage() + " | Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "Unknown"), false));
        }
    }
}