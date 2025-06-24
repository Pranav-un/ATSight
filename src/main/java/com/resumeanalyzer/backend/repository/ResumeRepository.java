package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findAllByUserOrderByUploadDateDesc(com.resumeanalyzer.backend.entity.User user);
} 