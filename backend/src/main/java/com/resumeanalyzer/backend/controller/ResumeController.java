package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Resume;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.ResumeService;
import com.resumeanalyzer.backend.service.UserService;
import com.resumeanalyzer.backend.util.JwtUtil;
import com.resumeanalyzer.backend.dto.ResumeVersionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {
    private final ResumeService resumeService;
    private final UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/upload")
    public ResponseEntity<Resume> uploadResume(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        try {
            // Extract JWT token and validate
            String authHeader = request.getHeader("Authorization");
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

            Resume resume = resumeService.uploadResume(file, user);
            return ResponseEntity.ok(resume);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/versions")
    public ResponseEntity<List<ResumeVersionDTO>> getResumeVersions(HttpServletRequest request) {
        try {
            // Extract JWT token and validate
            String authHeader = request.getHeader("Authorization");
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

            List<ResumeVersionDTO> versions = resumeService.getResumeVersions(user).stream().map(resume ->
                    new ResumeVersionDTO(resume.getId(), resume.getFileName(), resume.getUploadDate())
            ).collect(Collectors.toList());
            
            return ResponseEntity.ok(versions);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testAuth(HttpServletRequest request) {
        try {
            // Extract JWT token and validate
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid authorization header");
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            
            String email = jwtUtil.extractUsername(token);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            return ResponseEntity.ok("Authentication successful for user: " + user.getEmail());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteResume(@PathVariable Long id, HttpServletRequest request) {
        System.out.println("DELETE request received for resume ID: " + id);
        try {
            // Extract JWT token and validate
            String authHeader = request.getHeader("Authorization");
            System.out.println("Authorization header: " + (authHeader != null ? "Bearer [token]" : "null"));
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("Missing or invalid authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid authorization header");
            }

            String token = authHeader.substring(7);
            
            if (!jwtUtil.validateToken(token)) {
                System.out.println("Invalid JWT token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            
            String email = jwtUtil.extractUsername(token);
            System.out.println("Extracted email from token: " + email);
            
            // Get user by email
            User user = userService.loadUserByEmail(email);
            if (user == null) {
                System.out.println("User not found for email: " + email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            System.out.println("User found - ID: " + user.getId() + ", Email: " + user.getEmail());

            boolean deleted = resumeService.deleteResume(id, user);
            System.out.println("Delete operation result: " + deleted);
            
            if (deleted) {
                System.out.println("Resume deleted successfully");
                return ResponseEntity.ok("Resume deleted successfully");
            } else {
                System.out.println("Resume not found or not authorized to delete");
                return ResponseEntity.badRequest().body("Resume not found or not authorized to delete");
            }
        } catch (Exception e) {
            System.err.println("Error deleting resume: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting resume: " + e.getMessage());
        }
    }
}