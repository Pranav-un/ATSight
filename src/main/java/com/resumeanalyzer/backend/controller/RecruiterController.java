package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Leaderboard;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.entity.LeaderboardEntry;
import com.resumeanalyzer.backend.service.RecruiterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
public class RecruiterController {
    private final RecruiterService recruiterService;

    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/bulk-upload")
    public ResponseEntity<Leaderboard> bulkUpload(
            @RequestParam("resumes") List<MultipartFile> resumes,
            @RequestParam(value = "jd", required = false) MultipartFile jd,
            @AuthenticationPrincipal User recruiter) {
        Leaderboard leaderboard = recruiterService.bulkUpload(resumes, jd, recruiter);
        return ResponseEntity.ok(leaderboard);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/{id}")
    public ResponseEntity<Leaderboard> getLeaderboard(@PathVariable Long id, @AuthenticationPrincipal User recruiter) {
        Leaderboard leaderboard = recruiterService.getLeaderboard(id, recruiter);
        return ResponseEntity.ok(leaderboard);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/entry/{entryId}")
    public ResponseEntity<LeaderboardEntry> getLeaderboardEntry(@PathVariable Long entryId, @AuthenticationPrincipal User recruiter) {
        return ResponseEntity.ok(recruiterService.getLeaderboardEntry(entryId, recruiter));
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/entry/{entryId}/report")
    public ResponseEntity<byte[]> generateCandidatePdf(@PathVariable Long entryId, @AuthenticationPrincipal User recruiter) {
        byte[] pdf = recruiterService.generateCandidatePdf(entryId, recruiter);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=candidate_report_" + entryId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/{leaderboardId}/export-csv")
    public ResponseEntity<byte[]> exportLeaderboardCsv(@PathVariable Long leaderboardId,
                                                      @RequestParam(defaultValue = "10") int topN,
                                                      @AuthenticationPrincipal User recruiter) {
        byte[] csv = recruiterService.exportLeaderboardCsv(leaderboardId, topN, recruiter);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leaderboard_" + leaderboardId + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
} 