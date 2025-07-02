package com.resumeanalyzer.backend.repository;

import com.resumeanalyzer.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
 
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByActive(boolean active);
    long countByRole(User.Role role);
} 