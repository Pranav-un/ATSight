package com.resumeanalyzer.backend.service;

import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.web.multipart.MultipartFile;
 
public interface JobDescriptionService {
    JobDescription uploadJDText(String text, User user);
    JobDescription uploadJDFile(MultipartFile file, User user);
} 