package com.resumeanalyzer.backend.dto;

import com.resumeanalyzer.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private String accessToken;
    private String userRole;
    private User user;
    
    // Legacy constructor for backward compatibility
    public AuthResponse(String token, String userRole) {
        this.token = token;
        this.accessToken = token;
        this.userRole = userRole;
    }
    
    // Full constructor with user object
    public AuthResponse(String token, User user) {
        this.token = token;
        this.accessToken = token;
        this.userRole = user.getRole().name();
        this.user = user;
    }
} 