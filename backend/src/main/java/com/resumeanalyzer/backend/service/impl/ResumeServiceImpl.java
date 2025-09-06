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

    @Override
    public boolean deleteResume(Long resumeId, User user) {
        System.out.println("=== DELETE RESUME DEBUG START ===");
        System.out.println("deleteResume called - ResumeID: " + resumeId + ", UserID: " + user.getId() + ", UserEmail: " + user.getEmail());
        try {
            // Check if resume exists and belongs to the user using userId for comparison
            Resume resume = resumeRepository.findByIdAndUserId(resumeId, user.getId());
            System.out.println("Found resume with userId lookup: " + (resume != null ? "Yes (ID: " + resume.getId() + ", FileName: " + resume.getFileName() + ")" : "No"));
            
            if (resume == null) {
                System.out.println("Resume not found or doesn't belong to user - trying fallback method");
                // Fallback to original method
                resume = resumeRepository.findByIdAndUser(resumeId, user);
                System.out.println("Found resume with User object lookup: " + (resume != null ? "Yes (ID: " + resume.getId() + ", FileName: " + resume.getFileName() + ")" : "No"));
                
                if (resume == null) {
                    System.out.println("Resume not found with both methods - returning false");
                    return false; // Resume not found or doesn't belong to user
                }
            }

            // Delete the physical file from disk
            try {
                Path filePath = Paths.get(resume.getFilePath());
                System.out.println("Attempting to delete file: " + filePath);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("Physical file deleted successfully");
                } else {
                    System.out.println("Physical file doesn't exist");
                }
            } catch (IOException e) {
                System.err.println("Warning: Could not delete physical file: " + e.getMessage());
                // Continue with database deletion even if file deletion fails
            }

            // Delete from database
            resumeRepository.delete(resume);
            System.out.println("Resume deleted from database successfully");
            System.out.println("=== DELETE RESUME DEBUG END ===");
            return true;
        } catch (Exception e) {
            System.err.println("Error deleting resume: " + e.getMessage());
            e.printStackTrace();
            System.out.println("=== DELETE RESUME DEBUG END (ERROR) ===");
            return false;
        }
    }
} 