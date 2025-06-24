package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Resume;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.service.ResumeService;
import com.resumeanalyzer.backend.dto.ResumeVersionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {
    private final ResumeService resumeService;

    @PostMapping("/upload")
    public ResponseEntity<Resume> uploadResume(@RequestParam("file") MultipartFile file,
                                               @AuthenticationPrincipal User user) {
        Resume resume = resumeService.uploadResume(file, user);
        return ResponseEntity.ok(resume);
    }

    @GetMapping("/versions")
    public List<ResumeVersionDTO> getResumeVersions(@AuthenticationPrincipal User user) {
        return resumeService.getResumeVersions(user).stream().map(resume ->
            ResumeVersionDTO.builder()
                .id(resume.getId())
                .fileName(resume.getFileName())
                .uploadDate(resume.getUploadDate())
                .build()
        ).collect(Collectors.toList());
    }
} 