package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.entity.Resume;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ResumeService {
    Resume uploadResume(MultipartFile file, User user);
    List<Resume> getResumeVersions(User user);
} 