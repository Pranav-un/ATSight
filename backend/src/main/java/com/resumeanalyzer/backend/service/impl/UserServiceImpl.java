package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.dto.AuthRequest;
import com.resumeanalyzer.backend.dto.AuthResponse;
import com.resumeanalyzer.backend.entity.PasswordResetToken;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.repository.PasswordResetTokenRepository;
import com.resumeanalyzer.backend.repository.UserRepository;
import com.resumeanalyzer.backend.service.EmailService;
import com.resumeanalyzer.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.resumeanalyzer.backend.exception.AuthException;
import com.resumeanalyzer.backend.util.JwtUtil;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

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

    @Override
    @Transactional
    public void initiatePasswordReset(String email, String frontendUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Generate new reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Send email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), token, frontendUrl);
        } catch (Exception e) {
            throw new AuthException("Failed to send password reset email");
        }
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new AuthException("Invalid or expired reset token"));

        if (!resetToken.isValid()) {
            throw new AuthException("Reset token has expired or been used");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Clean up expired tokens
        passwordResetTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
} 