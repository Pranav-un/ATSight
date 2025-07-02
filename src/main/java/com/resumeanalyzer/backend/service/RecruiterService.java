package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.entity.User;
import org.springframework.web.multipart.MultipartFile;
import com.resumeanalyzer.backend.entity.Leaderboard;
import com.resumeanalyzer.backend.entity.LeaderboardEntry;
import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;
import com.resumeanalyzer.backend.dto.CandidateReportDTO;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface RecruiterService {
    Leaderboard bulkUpload(List<MultipartFile> resumes, MultipartFile jdFile, String jdText, String jdTitle, User recruiter);
    Leaderboard getLeaderboard(Long leaderboardId, User recruiter);
    LeaderboardEntry getLeaderboardEntry(Long entryId, User recruiter);
    CandidateReportDTO getCandidateReport(Long entryId, User recruiter);
    byte[] generateCandidatePdf(Long entryId, User recruiter);
    byte[] exportLeaderboardCsv(Long leaderboardId, int topN, User recruiter);
    LeaderboardEntry updateCandidateNotes(Long entryId, String notes, User recruiter);
    LeaderboardEntry toggleCandidateFavorite(Long entryId, User recruiter);
    List<Leaderboard> getRecruiterLeaderboards(User recruiter);
    void deleteLeaderboard(Long leaderboardId, User recruiter);
    CandidateAnalysisDTO getCandidateAnalytics(Long entryId, User recruiter);
    String getCandidateResumeFilePath(Long entryId, User recruiter);
}