package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.dto.AuthRequest;
import com.resumeanalyzer.backend.dto.AuthResponse;
import com.resumeanalyzer.backend.entity.User;
import java.util.Optional;
 
public interface UserService {
    User registerUser(AuthRequest request, User.Role role);
    AuthResponse authenticateUser(AuthRequest request);
    User loadUserByEmail(String email);
    Optional<User> findByEmail(String email);
} 