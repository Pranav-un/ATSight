package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.Resume;
import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findAllByUserOrderByUploadDateDesc(User user);
    int countByUser(User user);
    Resume findByIdAndUser(Long id, User user);
    
    @Query("SELECT r FROM Resume r WHERE r.id = :resumeId AND r.user.id = :userId")
    Resume findByIdAndUserId(@Param("resumeId") Long resumeId, @Param("userId") Long userId);
} 