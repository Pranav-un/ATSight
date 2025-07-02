package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateReportDTO {
    // Basic Info
    private String candidateName;
    private Integer rankPosition;
    private Double overallScore;
    private String resumeFileName;
    
    // Scores Breakdown
    private Double skillsScore;
    private Double experienceScore;
    private Double educationScore;
    private Double projectsScore;
    
    // JD Match Analysis (if JD provided)
    private Double jdMatchPercentage;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String fitAssessment;
    
    // Skills Analysis
    private List<String> allSkills;
    private Map<String, Double> skillCategoryScores;
    private Map<String, Integer> skillCategoryCounts;
    private String topSkillCategory;
    
    // Experience Analysis
    private String experienceLevel; // Junior, Mid, Senior, Expert
    private Integer totalYearsExperience;
    private List<String> experienceHighlights;
    private List<String> leadershipIndicators;
    
    // Projects & Achievements
    private List<String> projects;
    private List<String> projectHighlights;
    private Integer projectCount;
    
    // Education
    private List<String> education;
    private List<String> certifications;
    private String highestDegree;
    
    // Additional Insights
    private List<String> hackathons;
    private String candidateStrength;
    private String candidateWeakness;
    private String hiringRecommendation;
    
    // Sections (raw extracted text)
    private String extractedSkills;
    private String extractedExperience;
    private String extractedProjects;
    private String extractedEducation;
    
    // Recruiter specific
    private String notes;
    private Boolean isFavorite;
}
