package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.entity.User;
import org.springframework.web.multipart.MultipartFile;
import com.resumeanalyzer.backend.entity.Leaderboard;
import com.resumeanalyzer.backend.entity.LeaderboardEntry;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface RecruiterService {
    Leaderboard bulkUpload(List<MultipartFile> resumes, MultipartFile jd, User recruiter);
    Leaderboard getLeaderboard(Long leaderboardId, User recruiter);
    LeaderboardEntry getLeaderboardEntry(Long entryId, User recruiter);
    byte[] generateCandidatePdf(Long entryId, User recruiter);
    byte[] exportLeaderboardCsv(Long leaderboardId, int topN, User recruiter);
} 