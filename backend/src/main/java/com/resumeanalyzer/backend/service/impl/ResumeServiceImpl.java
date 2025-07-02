package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.entity.Resume;
import com.resumeanalyzer.backend.entity.User;
import com.resumeanalyzer.backend.repository.ResumeRepository;
import com.resumeanalyzer.backend.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {
    private final ResumeRepository resumeRepository;
    private final Tika tika = new Tika();
    private static final String UPLOAD_DIR = "uploads";

    @Override
    public Resume uploadResume(MultipartFile file, User user) {
        try {
            // Ensure upload directory exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            // Save file to disk
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath);
            // Extract text with Tika
            String parsedText = tika.parseToString(filePath.toFile());
            // Save Resume entity
            Resume resume = Resume.builder()
                    .user(user)
                    .fileName(fileName)
                    .filePath(filePath.toString())
                    .parsedText(parsedText)
                    .build();
            return resumeRepository.save(resume);
        } catch (IOException | org.apache.tika.exception.TikaException e) {
            throw new RuntimeException("Failed to upload or parse resume", e);
        }
    }

    @Override
    public List<Resume> getResumeVersions(User user) {
        return resumeRepository.findAllByUserOrderByUploadDateDesc(user);
    }
} 