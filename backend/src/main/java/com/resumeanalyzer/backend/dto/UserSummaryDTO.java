package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSummaryDTO {
    private Long id;
    private String email;
    private String role;
    private boolean active;

    public UserSummaryDTO(Long id, String email, String role) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.active = true;
    }
} 