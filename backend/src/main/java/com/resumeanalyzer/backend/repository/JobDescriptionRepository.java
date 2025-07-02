package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.JobDescription;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobDescriptionRepository extends JpaRepository<JobDescription, Long> {
    List<JobDescription> findAllByUserOrderByUploadDateDesc(User user);
} 