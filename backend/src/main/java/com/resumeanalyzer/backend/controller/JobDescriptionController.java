package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.JobDescriptionService;
import com.resumeanalyzer.backend.service.UserService;
import com.resumeanalyzer.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/jd")
@RequiredArgsConstructor
public class JobDescriptionController {
    private final JobDescriptionService jobDescriptionService;
    private final UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/upload-text")
    public ResponseEntity<JobDescription> uploadJDText(@RequestBody Map<String, String> body,
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

            String text = body.get("text");
            JobDescription jd = jobDescriptionService.uploadJDText(text, user);
            return ResponseEntity.ok(jd);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upload-file")
    public ResponseEntity<JobDescription> uploadJDFile(@RequestParam("file") MultipartFile file,
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

            JobDescription jd = jobDescriptionService.uploadJDFile(file, user);
            return ResponseEntity.ok(jd);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 