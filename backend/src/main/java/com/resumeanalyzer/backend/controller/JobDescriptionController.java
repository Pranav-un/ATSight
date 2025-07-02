package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/jd")
@RequiredArgsConstructor
public class JobDescriptionController {
    private final JobDescriptionService jobDescriptionService;

    @PostMapping("/upload-text")
    public ResponseEntity<JobDescription> uploadJDText(@RequestBody Map<String, String> body,
                                                      @AuthenticationPrincipal User user) {
        String text = body.get("text");
        JobDescription jd = jobDescriptionService.uploadJDText(text, user);
        return ResponseEntity.ok(jd);
    }

    @PostMapping("/upload-file")
    public ResponseEntity<JobDescription> uploadJDFile(@RequestParam("file") MultipartFile file,
                                                      @AuthenticationPrincipal User user) {
        JobDescription jd = jobDescriptionService.uploadJDFile(file, user);
        return ResponseEntity.ok(jd);
    }
} 