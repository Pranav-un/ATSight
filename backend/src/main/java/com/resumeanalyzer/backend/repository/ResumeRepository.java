package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Resume;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findAllByUserOrderByUploadDateDesc(User user);
    int countByUser(User user);
} 