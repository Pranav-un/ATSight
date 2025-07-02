package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.repository.JobDescriptionRepository;
import com.resumeanalyzer.backend.service.JobDescriptionService;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class JobDescriptionServiceImpl implements JobDescriptionService {
    private final JobDescriptionRepository jobDescriptionRepository;
    private final Tika tika = new Tika();
    private static final String JD_UPLOAD_DIR = "jd_uploads";

    @Override
    public JobDescription uploadJDText(String text, User user) {
        JobDescription jd = JobDescription.builder()
                .user(user)
                .text(text)
                .build();
        return jobDescriptionRepository.save(jd);
    }

    @Override
    public JobDescription uploadJDFile(MultipartFile file, User user) {
        try {
            Path uploadPath = Paths.get(JD_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath);
            String parsedText = tika.parseToString(filePath.toFile());
            JobDescription jd = JobDescription.builder()
                    .user(user)
                    .text(parsedText)
                    .fileName(fileName)
                    .filePath(filePath.toString())
                    .build();
            return jobDescriptionRepository.save(jd);
        } catch (IOException | org.apache.tika.exception.TikaException e) {
            throw new RuntimeException("Failed to upload or parse job description file", e);
        }
    }
} 