package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.dto.AuthRequest;
import com.resumeanalyzer.backend.dto.AuthResponse;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.repository.UserRepository;
import com.resumeanalyzer.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.resumeanalyzer.backend.exception.AuthException;
import com.resumeanalyzer.backend.util.JwtUtil;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public User registerUser(AuthRequest request, User.Role role) {
        Optional<User> existing = userRepository.findByEmail(request.getEmail());
        if (existing.isPresent()) {
            throw new AuthException("Email already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .build();
        return userRepository.save(user);
    }

    @Override
    public AuthResponse authenticateUser(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Invalid email or password"));
        if (!user.isActive()) {
            throw new AuthException("User account is deactivated. Please contact support.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid email or password");
        }
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user);
    }

    @Override
    public User loadUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));
        if (!user.isActive()) {
            throw new AuthException("User account is deactivated. Please contact support.");
        }
        return user;
    }
    
    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
} 