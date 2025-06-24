package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.entity.*;
import com.resumeanalyzer.backend.repository.*;
import com.resumeanalyzer.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
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
    private final Tika tika = new Tika();
    private static final String UPLOAD_DIR = "uploads";

    @Override
    public Leaderboard bulkUpload(List<MultipartFile> resumes, MultipartFile jdFile, User recruiter) {
        JobDescription jd = null;
        if (jdFile != null && !jdFile.isEmpty()) {
            jd = saveJobDescription(jdFile, recruiter);
        }
        Leaderboard leaderboard = Leaderboard.builder()
                .recruiter(recruiter)
                .jobDescription(jd)
                .build();
        leaderboard = leaderboardRepository.save(leaderboard);
        List<LeaderboardEntry> entries = new ArrayList<>();
        for (MultipartFile resumeFile : resumes) {
            Resume resume = saveResume(resumeFile, recruiter);
            String parsedText = resume.getParsedText();
            String candidateName = extractCandidateName(parsedText);
            // Extract additional info
            String skills = extractSection(parsedText, "skills?");
            String experience = extractSection(parsedText, "experience");
            String projects = extractSection(parsedText, "projects?");
            String hackathons = extractSection(parsedText, "hackathons?");
            Double matchScore = null;
            if (jd != null) {
                // Use skill extraction and matching logic
                List<String> resumeSkills = skillExtractionService.extractSkills(parsedText);
                List<String> jdSkills = skillExtractionService.extractSkills(jd.getText());
                Set<String> matched = new HashSet<>(resumeSkills);
                matched.retainAll(jdSkills);
                matchScore = skillExtractionService.computeSimilarity(parsedText, jd.getText());
            } else {
                // No JD: rank by experience, skills, projects, hackathons (simple heuristic)
                matchScore = computeHeuristicScore(skills, experience, projects, hackathons);
            }
            LeaderboardEntry entry = LeaderboardEntry.builder()
                    .leaderboard(leaderboard)
                    .candidateName(candidateName)
                    .resume(resume)
                    .matchScore(matchScore)
                    .skills(skills)
                    .experience(experience)
                    .projects(projects)
                    .hackathons(hackathons)
                    .build();
            entries.add(entry);
        }
        leaderboard.setEntries(leaderboardEntryRepository.saveAll(entries));
        return leaderboardRepository.save(leaderboard);
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

    private String extractCandidateName(String text) {
        // Simple heuristic: first line or regex for common name patterns
        String[] lines = text.split("\n");
        if (lines.length > 0 && lines[0].length() < 60) {
            return lines[0].trim();
        }
        Pattern p = Pattern.compile("Name[:\s]+([A-Z][a-z]+( [A-Z][a-z]+)+)");
        Matcher m = p.matcher(text);
        if (m.find()) {
            return m.group(1);
        }
        return "Unknown";
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
} 