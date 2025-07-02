package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.entity.*;
import com.resumeanalyzer.backend.repository.*;
import com.resumeanalyzer.backend.service.*;
import com.resumeanalyzer.backend.dto.CandidateAnalysisDTO;
import com.resumeanalyzer.backend.dto.CandidateReportDTO;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class RecruiterServiceImpl implements RecruiterService {
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final LeaderboardEntryRepository leaderboardEntryRepository;
    private final SkillExtractionService skillExtractionService;
    private final CandidateAnalysisService candidateAnalysisService;
    private final LLMAnalysisService llmAnalysisService;
    private final Tika tika = new Tika();
    private static final String UPLOAD_DIR = "uploads";

    @Override
    @Transactional
    public Leaderboard bulkUpload(List<MultipartFile> resumes, MultipartFile jdFile, String jdText, String jdTitle, User recruiter) {
        System.out.println("=== RecruiterServiceImpl.bulkUpload START (OPTIMIZED) ===");
        long startTime = System.currentTimeMillis();
        
        JobDescription jd = null;
        
        // Handle JD file upload
        if (jdFile != null && !jdFile.isEmpty()) {
            System.out.println("Processing JD file: " + jdFile.getOriginalFilename());
            jd = saveJobDescription(jdFile, recruiter);
            System.out.println("JD file saved with ID: " + jd.getId());
        } 
        // Handle JD text input
        else if (jdText != null && !jdText.trim().isEmpty()) {
            System.out.println("Processing JD text input (length: " + jdText.length() + ")");
            jd = saveJobDescriptionFromText(jdText, jdTitle, recruiter);
            System.out.println("JD text saved with ID: " + jd.getId());
        } else {
            System.out.println("No JD provided - processing resumes without job description");
        }
        
        System.out.println("Creating leaderboard...");
        Leaderboard leaderboard = Leaderboard.builder()
                .recruiter(recruiter)
                .jobDescription(jd)
                .build();
        leaderboard = leaderboardRepository.save(leaderboard);
        System.out.println("Leaderboard created with ID: " + leaderboard.getId());
        
        System.out.println("Processing " + resumes.size() + " resume files (BATCH MODE)...");
        List<LeaderboardEntry> entries = new ArrayList<>();
        
        // Process resumes in batches for better performance
        int batchSize = 5; // Process 5 resumes at a time
        for (int i = 0; i < resumes.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, resumes.size());
            List<MultipartFile> batch = resumes.subList(i, endIndex);
            
            System.out.println("Processing batch " + (i/batchSize + 1) + " (" + batch.size() + " resumes)...");
            List<LeaderboardEntry> batchEntries = processBatch(batch, leaderboard, jd, recruiter);
            entries.addAll(batchEntries);
            
            // Save intermediate results to prevent data loss
            if (!batchEntries.isEmpty()) {
                leaderboardEntryRepository.saveAll(batchEntries);
                System.out.println("Saved batch " + (i/batchSize + 1) + " with " + batchEntries.size() + " entries");
            }
        }
        
        System.out.println("All batches processed. Total entries: " + entries.size());
        
        // Assign ranks based on match scores (highest score = rank 1)
        System.out.println("Assigning ranks based on scores...");
        entries.sort((a, b) -> {
            if (a.getMatchScore() == null && b.getMatchScore() == null) return 0;
            if (a.getMatchScore() == null) return 1; // nulls last
            if (b.getMatchScore() == null) return -1;
            return Double.compare(b.getMatchScore(), a.getMatchScore()); // descending
        });
        
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRankPosition(i + 1); // 1-based ranking
        }
        
        System.out.println("Saving entries with rank positions...");
        List<LeaderboardEntry> savedEntries = leaderboardEntryRepository.saveAll(entries);
        leaderboard.setEntries(savedEntries);
        
        long endTime = System.currentTimeMillis();
        System.out.println("Saving final leaderboard...");
        Leaderboard finalLeaderboard = leaderboardRepository.save(leaderboard);
        System.out.println("=== RecruiterServiceImpl.bulkUpload COMPLETED in " + (endTime - startTime) + "ms ===");
        
        return finalLeaderboard;
    }
    
    private List<LeaderboardEntry> processBatch(List<MultipartFile> batch, Leaderboard leaderboard, JobDescription jd, User recruiter) {
        List<LeaderboardEntry> entries = new ArrayList<>();
        
        for (int i = 0; i < batch.size(); i++) {
            MultipartFile resumeFile = batch.get(i);
            System.out.println("Processing resume in batch: " + resumeFile.getOriginalFilename());
            
            try {
                Resume resume = saveResume(resumeFile, recruiter);
                System.out.println("Resume saved with ID: " + resume.getId());
                
                String parsedText = resume.getParsedText();
                String candidateName = extractCandidateNameWithLLM(parsedText);
                System.out.println("Extracted candidate name: " + candidateName);
                
                // Use optimized analysis service
                if (jd != null) {
                    System.out.println("Analyzing with JD (optimized)...");
                    var analysis = candidateAnalysisService.analyzeWithJobDescription(parsedText, jd.getText());
                    System.out.println("Analysis completed. Overall score: " + analysis.getOverallScore());
                    
                    LeaderboardEntry entry = LeaderboardEntry.builder()
                            .leaderboard(leaderboard)
                            .candidateName(candidateName)
                            .resume(resume)
                            .matchScore(analysis.getOverallScore())
                            .skills(String.join(", ", 
                                   (analysis.getMatchedSkills() != null && !analysis.getMatchedSkills().isEmpty()) ? 
                                   analysis.getMatchedSkills() : analysis.getSkills()))
                            .experience(analysis.getExperienceLevel())
                            .projects(String.join(", ", analysis.getProjects()))
                            .hackathons(String.join(", ", analysis.getHackathons()))
                            .build();
                    entries.add(entry);
                    System.out.println("Entry created for candidate: " + candidateName);
                } else {
                    System.out.println("Analyzing without JD (optimized)...");
                    var analysis = candidateAnalysisService.analyzeWithoutJobDescription(parsedText);
                    System.out.println("Analysis completed. Overall score: " + analysis.getOverallScore());
                    
                    LeaderboardEntry entry = LeaderboardEntry.builder()
                            .leaderboard(leaderboard)
                            .candidateName(candidateName)
                            .resume(resume)
                            .matchScore(analysis.getOverallScore())
                            .skills(String.join(", ", analysis.getSkills()))
                            .experience(analysis.getExperienceLevel())
                            .projects(String.join(", ", analysis.getProjects()))
                            .hackathons(String.join(", ", analysis.getHackathons()))
                            .build();
                    entries.add(entry);
                    System.out.println("Entry created for candidate: " + candidateName);
                }
            } catch (Exception e) {
                System.err.println("Error processing resume " + resumeFile.getOriginalFilename() + ": " + e.getMessage());
                e.printStackTrace();
                // Continue with other resumes instead of failing completely
            }
        }
        
        return entries;
    }
    
    @Override
    public Leaderboard getLeaderboard(Long leaderboardId, User recruiter) {
        Leaderboard leaderboard = leaderboardRepository.findById(leaderboardId)
                .orElseThrow(() -> new RuntimeException("Leaderboard not found"));
        if (!leaderboard.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        return leaderboard;
    }

    @Override
    public LeaderboardEntry getLeaderboardEntry(Long entryId, User recruiter) {
        LeaderboardEntry entry = leaderboardEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found"));
        if (!entry.getLeaderboard().getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        return entry;
    }

    @Override
    public byte[] generateCandidatePdf(Long entryId, User recruiter) {
        LeaderboardEntry entry = getLeaderboardEntry(entryId, recruiter);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();
            document.add(new Paragraph("Candidate Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph("Candidate Name: " + entry.getCandidateName()));
            document.add(new Paragraph("Match Score: " + (entry.getMatchScore() != null ? String.format("%.2f", entry.getMatchScore() * 100) + "%" : "N/A")));
            document.add(new Paragraph("Skills: " + entry.getSkills()));
            document.add(new Paragraph("Experience: " + entry.getExperience()));
            document.add(new Paragraph("Projects: " + entry.getProjects()));
            document.add(new Paragraph("Hackathons: " + entry.getHackathons()));
            if (entry.getLeaderboard().getJobDescription() != null) {
                document.add(new Paragraph("\nJob Description: " + entry.getLeaderboard().getJobDescription().getTitle()));
            }
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    @Override
    public byte[] exportLeaderboardCsv(Long leaderboardId, int topN, User recruiter) {
        Leaderboard leaderboard = getLeaderboard(leaderboardId, recruiter);
        List<LeaderboardEntry> entries = leaderboard.getEntries();
        // Sort by matchScore descending, nulls last
        entries = entries.stream()
                .sorted(Comparator.comparing((LeaderboardEntry e) -> e.getMatchScore() == null ? -1 : e.getMatchScore()).reversed())
                .limit(topN)
                .collect(Collectors.toList());
        StringBuilder sb = new StringBuilder();
        sb.append("Candidate Name,Match Score,Skills,Experience,Projects,Hackathons\n");
        for (LeaderboardEntry entry : entries) {
            sb.append('"').append(entry.getCandidateName().replaceAll("\"", "")).append('"').append(',');
            sb.append(entry.getMatchScore() != null ? String.format("%.2f", entry.getMatchScore() * 100) : "N/A").append(',');
            sb.append('"').append(entry.getSkills().replaceAll("\"", "")).append('"').append(',');
            sb.append('"').append(entry.getExperience().replaceAll("\"", "")).append('"').append(',');
            sb.append('"').append(entry.getProjects().replaceAll("\"", "")).append('"').append(',');
            sb.append('"').append(entry.getHackathons().replaceAll("\"", "")).append('"').append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private Resume saveResume(MultipartFile file, User user) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath);
            String parsedText = tika.parseToString(filePath.toFile());
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

    private JobDescription saveJobDescriptionFromText(String jdText, String jdTitle, User user) {
        JobDescription jd = JobDescription.builder()
                .user(user)
                .fileName(null) // No file for text input
                .filePath(null) // No file path for text input
                .text(jdText)
                .title(jdTitle != null && !jdTitle.trim().isEmpty() ? jdTitle : "Job Description")
                .build();
        return jobDescriptionRepository.save(jd);
    }

    private JobDescription saveJobDescription(MultipartFile file, User user) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath);
            String parsedText = tika.parseToString(filePath.toFile());
            JobDescription jd = JobDescription.builder()
                    .user(user)
                    .fileName(fileName)
                    .filePath(filePath.toString())
                    .text(parsedText)
                    .title(file.getOriginalFilename())
                    .build();
            return jobDescriptionRepository.save(jd);
        } catch (IOException | org.apache.tika.exception.TikaException e) {
            throw new RuntimeException("Failed to upload or parse JD", e);
        }
    }

    private String extractCandidateNameWithLLM(String text) {
        // Try LLM first if available
        if (llmAnalysisService.isLLMAvailable()) {
            try {
                String llmName = llmAnalysisService.extractCandidateNameWithLLM(text);
                if (!llmName.equals("Unknown Candidate")) {
                    return llmName;
                }
            } catch (Exception e) {
                System.err.println("LLM name extraction failed, falling back to rule-based: " + e.getMessage());
            }
        }
        
        // Fallback to enhanced rule-based extraction
        return extractCandidateName(text);
    }

    private String extractCandidateName(String text) {
        // Enhanced name extraction with multiple patterns
        String[] lines = text.split("\n");
        
        // Strategy 1: Check first few lines for names
        for (int i = 0; i < Math.min(5, lines.length); i++) {
            String line = lines[i].trim();
            if (line.length() > 0 && line.length() < 60) {
                // Clean up common resume headers
                line = line.replaceAll("(?i)resume|cv|curriculum vitae", "").trim();
                line = line.replaceAll("^[\\s\\-_=]+|[\\s\\-_=]+$", ""); // Remove decorative chars
                
                // Check if it looks like a name (2-4 words, proper case)
                if (isValidName(line)) {
                    return line;
                }
            }
        }
        
        // Strategy 2: Look for explicit name patterns
        Pattern[] namePatterns = {
            Pattern.compile("(?i)name[:\\s]+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,3})"),
            Pattern.compile("(?i)candidate[:\\s]+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,3})"),
            Pattern.compile("(?i)applicant[:\\s]+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,3})"),
            // Pattern for names at start of line
            Pattern.compile("^([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,3})\\s*$", Pattern.MULTILINE)
        };
        
        for (Pattern pattern : namePatterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String name = matcher.group(1).trim();
                if (isValidName(name)) {
                    return name;
                }
            }
        }
        
        // Strategy 3: Extract from email if present
        Pattern emailPattern = Pattern.compile("([a-z]+(?:\\.[a-z]+)*|[a-z]+(?:[a-z]+)*)\\.?[a-z]*@[a-z]+\\.[a-z]+", Pattern.CASE_INSENSITIVE);
        Matcher emailMatcher = emailPattern.matcher(text);
        if (emailMatcher.find()) {
            String emailPart = emailMatcher.group(1);
            String[] parts = emailPart.split("\\.");
            if (parts.length >= 2) {
                return capitalize(parts[0]) + " " + capitalize(parts[1]);
            }
        }
        
        return "Unknown Candidate";
    }
    
    private boolean isValidName(String name) {
        if (name == null || name.length() < 3 || name.length() > 50) {
            return false;
        }
        
        String[] words = name.split("\\s+");
        if (words.length < 2 || words.length > 4) {
            return false;
        }
        
        // Check if words look like names (start with capital, contain only letters)
        for (String word : words) {
            if (!word.matches("[A-Z][a-z]{1,15}")) {
                return false;
            }
        }
        
        // Exclude common non-name words
        String lowerName = name.toLowerCase();
        String[] excludeWords = {"resume", "curriculum", "vitae", "profile", "contact", "address", "phone", "email", "objective", "summary"};
        for (String exclude : excludeWords) {
            if (lowerName.contains(exclude)) {
                return false;
            }
        }
        
        return true;
    }
    
    private String capitalize(String word) {
        if (word == null || word.length() == 0) {
            return word;
        }
        return word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase();
    }

    private String extractSection(String text, String section) {
        // Simple: find section header and grab next 5 lines
        Pattern p = Pattern.compile(section + ".*", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        if (m.find()) {
            int start = m.start();
            int end = Math.min(text.length(), start + 500); // up to 500 chars after header
            return text.substring(start, end).replaceAll("\n", " ").trim();
        }
        return "";
    }

    private double computeHeuristicScore(String skills, String experience, String projects, String hackathons) {
        // Simple scoring: count non-empty sections
        double score = 0;
        if (!skills.isEmpty()) score += 0.3;
        if (!experience.isEmpty()) score += 0.3;
        if (!projects.isEmpty()) score += 0.2;
        if (!hackathons.isEmpty()) score += 0.2;
        return score;
    }

    @Override
    public LeaderboardEntry updateCandidateNotes(Long entryId, String notes, User recruiter) {
        LeaderboardEntry entry = getLeaderboardEntry(entryId, recruiter);
        entry.setNotes(notes);
        return leaderboardEntryRepository.save(entry);
    }

    @Override
    public LeaderboardEntry toggleCandidateFavorite(Long entryId, User recruiter) {
        LeaderboardEntry entry = getLeaderboardEntry(entryId, recruiter);
        entry.setIsFavorite(!entry.getIsFavorite());
        return leaderboardEntryRepository.save(entry);
    }

    @Override
    public List<Leaderboard> getRecruiterLeaderboards(User recruiter) {
        return leaderboardRepository.findByRecruiterOrderByCreatedAtDesc(recruiter);
    }

    @Override
    public CandidateAnalysisDTO getCandidateAnalytics(Long entryId, User recruiter) {
        LeaderboardEntry entry = getLeaderboardEntry(entryId, recruiter);
        String resumeText = entry.getResume().getParsedText();
        
        if (entry.getLeaderboard().getJobDescription() != null) {
            String jdText = entry.getLeaderboard().getJobDescription().getText();
            return candidateAnalysisService.analyzeWithJobDescription(resumeText, jdText);
        } else {
            return candidateAnalysisService.analyzeWithoutJobDescription(resumeText);
        }
    }

    @Override
    public CandidateReportDTO getCandidateReport(Long entryId, User recruiter) {
        System.out.println("=== Generating detailed candidate report for entry ID: " + entryId + " ===");
        
        LeaderboardEntry entry = getLeaderboardEntry(entryId, recruiter);
        String resumeText = entry.getResume().getParsedText();
        
        // Get comprehensive analysis
        CandidateAnalysisDTO analysis;
        if (entry.getLeaderboard().getJobDescription() != null) {
            String jdText = entry.getLeaderboard().getJobDescription().getText();
            analysis = candidateAnalysisService.analyzeWithJobDescription(resumeText, jdText);
        } else {
            analysis = candidateAnalysisService.analyzeWithoutJobDescription(resumeText);
        }
        
        // Determine top skill category
        String topSkillCategory = analysis.getSkillCategoryScores() != null 
            ? analysis.getSkillCategoryScores().entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General")
            : "General";
        
        // Generate hiring recommendation
        String hiringRecommendation = generateHiringRecommendation(analysis, entry.getRankPosition());
        
        return CandidateReportDTO.builder()
            .candidateName(entry.getCandidateName())
            .rankPosition(entry.getRankPosition())
            .overallScore(analysis.getOverallScore())
            .resumeFileName(entry.getResume().getFileName())
            
            // Scores
            .skillsScore(analysis.getSkillsScore())
            .experienceScore(analysis.getExperienceScore())
            .educationScore(analysis.getEducationScore())
            .projectsScore(analysis.getProjectsScore())
            
            // JD Match (if available)
            .jdMatchPercentage(analysis.getJdMatchPercentage())
            .matchedSkills(analysis.getMatchedSkills())
            .missingSkills(analysis.getMissingSkills())
            .fitAssessment(analysis.getFitAssessment())
            
            // Skills
            .allSkills(analysis.getSkills())
            .skillCategoryScores(analysis.getSkillCategoryScores())
            .skillCategoryCounts(analysis.getSkillCategoryCounts())
            .topSkillCategory(topSkillCategory)
            
            // Experience
            .experienceLevel(analysis.getExperienceLevel())
            .totalYearsExperience(analysis.getTotalYearsExperience())
            .experienceHighlights(analysis.getExperienceHighlights())
            
            // Projects & Education
            .projects(analysis.getProjects())
            .projectHighlights(analysis.getProjectHighlights())
            .projectCount(analysis.getProjects() != null ? analysis.getProjects().size() : 0)
            .education(analysis.getEducation())
            .certifications(analysis.getCertificationHighlights())
            .hackathons(analysis.getHackathons())
            
            // Insights
            .candidateStrength(analysis.getCandidateStrength())
            .candidateWeakness(analysis.getCandidateWeakness())
            .hiringRecommendation(hiringRecommendation)
            
            // Raw sections
            .extractedSkills(analysis.getExtractedSkills())
            .extractedExperience(analysis.getExtractedExperience())
            .extractedProjects(analysis.getExtractedProjects())
            .extractedEducation(analysis.getExtractedEducation())
            
            // Recruiter data
            .notes(entry.getNotes())
            .isFavorite(entry.getIsFavorite())
            .build();
    }
    
    private String generateHiringRecommendation(CandidateAnalysisDTO analysis, Integer rank) {
        double score = analysis.getOverallScore();
        
        if (rank != null && rank <= 3) {
            return "🏆 TOP CANDIDATE - Strongly recommend for immediate interview";
        } else if (score >= 0.8) {
            return "✅ HIGHLY RECOMMENDED - Excellent fit, proceed with interview";
        } else if (score >= 0.6) {
            return "👍 RECOMMENDED - Good candidate, consider for interview";
        } else if (score >= 0.4) {
            return "⚠️ CONDITIONAL - May need additional screening or training";
        } else {
            return "❌ NOT RECOMMENDED - Significant gaps in requirements";
        }
    }

    @Override
    public void deleteLeaderboard(Long leaderboardId, User recruiter) {
        System.out.println("=== Deleting leaderboard ID: " + leaderboardId + " for recruiter: " + recruiter.getEmail() + " ===");
        
        Leaderboard leaderboard = leaderboardRepository.findById(leaderboardId)
                .orElseThrow(() -> new RuntimeException("Leaderboard not found"));
        
        // Verify the leaderboard belongs to the recruiter
        if (!leaderboard.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Access denied: Leaderboard does not belong to this recruiter");
        }
        
        // Delete all associated entries first (cascade should handle this, but being explicit)
        System.out.println("Deleting " + leaderboard.getEntries().size() + " leaderboard entries");
        
        leaderboardRepository.delete(leaderboard);
        System.out.println("Leaderboard deleted successfully");
    }

    @Override
    public String getCandidateResumeFilePath(Long entryId, User recruiter) {
        System.out.println("=== Getting resume file path for entry ID: " + entryId + " ===");
        
        LeaderboardEntry entry = leaderboardEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Leaderboard entry not found"));
        
        // Verify the entry belongs to a leaderboard owned by the recruiter
        if (!entry.getLeaderboard().getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Access denied: Leaderboard entry does not belong to this recruiter");
        }
        
        Resume resume = entry.getResume();
        String filePath = resume.getFilePath();
        
        System.out.println("Resume file path: " + filePath);
        return filePath;
    }
}