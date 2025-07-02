package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.dto.UserSummaryDTO;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.repository.UserRepository;
import com.resumeanalyzer.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import com.resumeanalyzer.backend.dto.PlatformAnalyticsDTO;
import com.resumeanalyzer.backend.repository.ResumeRepository;
import com.resumeanalyzer.backend.repository.JobDescriptionRepository;
import com.resumeanalyzer.backend.repository.AnalysisRepository;
import com.resumeanalyzer.backend.dto.UserActivityDTO;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final AnalysisRepository analysisRepository;

    @Override
    public List<UserSummaryDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserSummaryDTO(user.getId(), user.getEmail(), user.getRole().name(), user.isActive()))
                .collect(Collectors.toList());
    }

    @Override
    public UserSummaryDTO setUserActiveStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(active);
        userRepository.save(user);
        return new UserSummaryDTO(user.getId(), user.getEmail(), user.getRole().name(), user.isActive());
    }

    @Override
    public PlatformAnalyticsDTO getPlatformAnalytics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActive(true);
        long inactiveUsers = userRepository.countByActive(false);
        long jobseekers = userRepository.countByRole(com.resumeanalyzer.backend.entity.User.Role.JOBSEEKER);
        long recruiters = userRepository.countByRole(com.resumeanalyzer.backend.entity.User.Role.RECRUITER);
        long admins = userRepository.countByRole(com.resumeanalyzer.backend.entity.User.Role.ADMIN);
        long totalResumes = resumeRepository.count();
        long totalJobDescriptions = jobDescriptionRepository.count();
        long totalAnalyses = analysisRepository.count();
        return new PlatformAnalyticsDTO(
            totalUsers, activeUsers, inactiveUsers, jobseekers, recruiters, admins,
            totalResumes, totalJobDescriptions, totalAnalyses
        );
    }

    @Override
    public UserActivityDTO getUserActivity(Long userId) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        var user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        var resumes = resumeRepository.findAllByUserOrderByUploadDateDesc(user).stream()
                .map(r -> new UserActivityDTO.ResumeSummary(r.getId(), r.getFileName(), r.getUploadDate() != null ? r.getUploadDate().format(fmt) : null))
                .toList();
        var jds = jobDescriptionRepository.findAllByUserOrderByUploadDateDesc(user).stream()
                .map(jd -> new UserActivityDTO.JobDescriptionSummary(jd.getId(), jd.getTitle(), jd.getUploadDate() != null ? jd.getUploadDate().format(fmt) : null))
                .toList();
        var analyses = analysisRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(a -> new UserActivityDTO.AnalysisSummary(
                        a.getId(),
                        a.getResume() != null ? a.getResume().getFileName() : null,
                        a.getJobDescription() != null ? a.getJobDescription().getTitle() : null,
                        a.getCreatedAt() != null ? a.getCreatedAt().format(fmt) : null,
                        a.getMatchScore()
                ))
                .toList();
        return new UserActivityDTO(resumes, jds, analyses);
    }
} 