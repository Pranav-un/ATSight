package com.resumeanalyzer.backend.controller;

import com.resumeanalyzer.backend.entity.Leaderboard;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.entity.LeaderboardEntry;
import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;
import com.resumeanalyzer.backend.dto.CandidateReportDTO;
import com.resumeanalyzer.backend.service.RecruiterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

import java.util.List;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
public class RecruiterController {
    private final RecruiterService recruiterService;
    private final com.resumeanalyzer.backend.repository.LeaderboardRepository leaderboardRepository;

    @GetMapping("/test-connection")
    public ResponseEntity<String> testConnection() {
        return ResponseEntity.ok("Backend connection successful! Time: " + new java.util.Date());
    }
    
    @GetMapping("/leaderboards-test") 
    @Transactional(readOnly = true)
    public ResponseEntity<String> getLeaderboardsForTesting() {
        System.out.println("TEST ENDPOINT: Getting all leaderboards without authentication");
        try {
            List<Leaderboard> leaderboards = leaderboardRepository.findAll();
            System.out.println("Found " + leaderboards.size() + " leaderboards in the database");
            
            StringBuilder details = new StringBuilder();
            details.append("Database check: Found " + leaderboards.size() + " leaderboards:\n");
            
            for (Leaderboard lb : leaderboards) {
                details.append("  - ID: " + lb.getId());
                if (lb.getRecruiter() != null) {
                    details.append(", Recruiter ID: " + lb.getRecruiter().getId());
                    details.append(", Recruiter Email: " + lb.getRecruiter().getEmail());
                }
                details.append(", Created: " + lb.getCreatedAt());
                details.append("\n");
            }
            
            return ResponseEntity.ok(details.toString());
        } catch (Exception e) {
            System.out.println("Error accessing leaderboards: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/test")
    public ResponseEntity<String> testRecruiterAuth(@AuthenticationPrincipal User recruiter) {
        return ResponseEntity.ok("Recruiter access successful for: " + recruiter.getEmail());
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("RecruiterController is healthy at " + new java.util.Date());
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/bulk-upload")
    public ResponseEntity<Leaderboard> bulkUpload(
            @RequestParam("resumes") List<MultipartFile> resumes,
            @RequestParam(value = "jd", required = false) MultipartFile jdFile,
            @RequestParam(value = "jdText", required = false) String jdText,
            @RequestParam(value = "jdTitle", required = false) String jdTitle,
            @AuthenticationPrincipal User recruiter) {
        
        System.out.println("=== BULK UPLOAD REQUEST RECEIVED ===");
        System.out.println("Recruiter: " + (recruiter != null ? recruiter.getEmail() : "null"));
        System.out.println("Number of resumes: " + (resumes != null ? resumes.size() : 0));
        System.out.println("JD file provided: " + (jdFile != null && !jdFile.isEmpty()));
        System.out.println("JD text provided: " + (jdText != null && !jdText.trim().isEmpty()));
        System.out.println("JD title: " + jdTitle);
        
        // Validate that at least one JD source is provided
        boolean hasJdFile = jdFile != null && !jdFile.isEmpty();
        boolean hasJdText = jdText != null && !jdText.trim().isEmpty();
        
        if (!hasJdFile && !hasJdText) {
            System.err.println("ERROR: No job description provided");
            return ResponseEntity.badRequest().build();
        }
        
        if (resumes != null) {
            for (int i = 0; i < resumes.size(); i++) {
                MultipartFile resume = resumes.get(i);
                System.out.println("Resume " + (i+1) + ": " + resume.getOriginalFilename() + " (" + resume.getSize() + " bytes)");
            }
        }
        
        try {
            System.out.println("Calling recruiterService.bulkUpload...");
            Leaderboard leaderboard = recruiterService.bulkUpload(resumes, jdFile, jdText, jdTitle, recruiter);
            System.out.println("Bulk upload completed successfully. Leaderboard ID: " + leaderboard.getId());
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            System.err.println("Error in bulk upload: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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
    @GetMapping("/leaderboard/entry/{entryId}/report/pdf")
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

    @PreAuthorize("hasRole('RECRUITER')")
    @PatchMapping(value = "/leaderboard/entry/{entryId}/notes", consumes = {"text/plain", "application/json"})
    public ResponseEntity<Map<String, Object>> updateCandidateNotes(@PathVariable Long entryId,
                                                                @RequestBody String notes,
                                                                @AuthenticationPrincipal User recruiter) {
        System.out.println("=== UPDATE NOTES REQUEST ===");
        System.out.println("Entry ID: " + entryId);
        System.out.println("Notes received: '" + notes + "'");
        System.out.println("Notes length: " + (notes != null ? notes.length() : "null"));
        System.out.println("Recruiter: " + recruiter.getEmail());
        
        LeaderboardEntry entry = recruiterService.updateCandidateNotes(entryId, notes, recruiter);
        
        System.out.println("Notes saved to entry: '" + entry.getNotes() + "'");
        System.out.println("=== UPDATE NOTES RESPONSE ===");
        
        // Create a simple response to avoid lazy loading issues
        Map<String, Object> response = new HashMap<>();
        response.put("id", entry.getId());
        response.put("notes", entry.getNotes());
        response.put("candidateName", entry.getCandidateName());
        response.put("success", true);
        
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PatchMapping("/leaderboard/entry/{entryId}/favorite")
    public ResponseEntity<LeaderboardEntry> toggleCandidateFavorite(@PathVariable Long entryId,
                                                                   @AuthenticationPrincipal User recruiter) {
        LeaderboardEntry entry = recruiterService.toggleCandidateFavorite(entryId, recruiter);
        return ResponseEntity.ok(entry);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboards")
    public ResponseEntity<List<Leaderboard>> getRecruiterLeaderboards(@AuthenticationPrincipal User recruiter) {
        List<Leaderboard> leaderboards = recruiterService.getRecruiterLeaderboards(recruiter);
        return ResponseEntity.ok(leaderboards);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/entry/{entryId}/analytics")
    public ResponseEntity<CandidateAnalysisDTO> getCandidateAnalytics(@PathVariable Long entryId, @AuthenticationPrincipal User recruiter) {
        CandidateAnalysisDTO analytics = recruiterService.getCandidateAnalytics(entryId, recruiter);
        return ResponseEntity.ok(analytics);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/entry/{entryId}/report")
    public ResponseEntity<CandidateReportDTO> getCandidateReport(@PathVariable Long entryId, @AuthenticationPrincipal User recruiter) {
        CandidateReportDTO report = recruiterService.getCandidateReport(entryId, recruiter);
        return ResponseEntity.ok(report);
    }

    //@PreAuthorize("hasRole('RECRUITER')")
    @DeleteMapping("/leaderboard/{leaderboardId}")
    @Transactional
    public ResponseEntity<String> deleteLeaderboard(@PathVariable Long leaderboardId) {
        System.out.println("DELETE request received for leaderboard ID: " + leaderboardId);
        
        try {
            // First, get the leaderboard to check who owns it
            Leaderboard leaderboard = leaderboardRepository.findById(leaderboardId)
                    .orElseThrow(() -> new RuntimeException("Leaderboard not found"));
            
            // Use the actual owner of the leaderboard instead of a test user
            User actualOwner = leaderboard.getRecruiter();
            System.out.println("Found leaderboard owner: ID=" + actualOwner.getId() + ", Email=" + actualOwner.getEmail());
            
            recruiterService.deleteLeaderboard(leaderboardId, actualOwner);
            System.out.println("Leaderboard deletion completed successfully");
            
            return ResponseEntity.ok("Leaderboard deleted successfully");
        } catch (Exception e) {
            System.err.println("Error deleting leaderboard: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to delete leaderboard: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @GetMapping("/leaderboard/entry/{entryId}/download-resume")
    public ResponseEntity<Resource> downloadCandidateResume(@PathVariable Long entryId, @AuthenticationPrincipal User recruiter) {
        try {
            // Get the resume file path from the service
            String filePath = recruiterService.getCandidateResumeFilePath(entryId, recruiter);
            Path path = Paths.get(filePath);
            Resource resource = new FileSystemResource(path);
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            // Extract filename from path
            String filename = path.getFileName().toString();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}