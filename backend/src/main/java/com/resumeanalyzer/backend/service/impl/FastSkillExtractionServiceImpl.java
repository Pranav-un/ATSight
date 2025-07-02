package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.service.SkillExtractionService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Primary
public class FastSkillExtractionServiceImpl implements SkillExtractionService {
    private static final Logger logger = LoggerFactory.getLogger(FastSkillExtractionServiceImpl.class);
    
    // Comprehensive skill database organized by categories
    private static final Set<String> PROGRAMMING_LANGUAGES = Set.of(
        "java", "python", "javascript", "typescript", "c++", "c#", "c", "go", "rust", "php", "ruby", 
        "kotlin", "swift", "scala", "r", "matlab", "perl", "shell", "bash", "powershell", "vba",
        "objective-c", "dart", "groovy", "lua", "haskell", "erlang", "clojure", "f#", "cobol", "fortran"
    );
    
    private static final Set<String> FRAMEWORKS_LIBRARIES = Set.of(
        "react", "angular", "vue", "svelte", "express", "flask", "django", "spring", "spring boot",
        "nodejs", "node.js", "laravel", "symfony", "codeigniter", "rails", "ruby on rails", "asp.net",
        ".net", "dotnet", "hibernate", "mybatis", "jpa", "entity framework", "sequelize", "mongoose",
        "redux", "mobx", "rxjs", "jquery", "bootstrap", "tailwind", "material-ui", "ant design",
        "electron", "react native", "flutter", "xamarin", "ionic", "cordova", "phonegap"
    );
    
    private static final Set<String> DATABASES = Set.of(
        "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra", "oracle", "sql server",
        "sqlite", "mariadb", "dynamodb", "firestore", "couchdb", "neo4j", "influxdb", "clickhouse",
        "hbase", "bigquery", "snowflake", "redshift", "athena", "aurora", "cosmos db"
    );
    
    private static final Set<String> CLOUD_TECHNOLOGIES = Set.of(
        "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", "terraform", "ansible",
        "chef", "puppet", "vagrant", "openshift", "heroku", "netlify", "vercel", "cloudflare",
        "s3", "ec2", "lambda", "api gateway", "cloudformation", "cloud functions", "app engine",
        "cloud storage", "cloud sql", "iam", "vpc", "load balancer", "cdn", "route 53"
    );
    
    private static final Set<String> DATA_SCIENCE_ML = Set.of(
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv", "nltk",
        "spacy", "matplotlib", "seaborn", "plotly", "jupyter", "anaconda", "spark", "hadoop",
        "kafka", "airflow", "dask", "xgboost", "lightgbm", "catboost", "tableau", "power bi",
        "qlik", "looker", "r studio", "sas", "spss", "stata", "machine learning", "deep learning",
        "neural networks", "nlp", "computer vision", "data mining", "big data", "etl"
    );
    
    private static final Set<String> MOBILE_TECHNOLOGIES = Set.of(
        "android", "ios", "react native", "flutter", "xamarin", "ionic", "cordova", "phonegap",
        "swift", "objective-c", "kotlin", "java android", "android studio", "xcode", "firebase",
        "core data", "realm", "sqlite mobile", "push notifications", "in-app purchases"
    );
    
    private static final Set<String> TESTING_TOOLS = Set.of(
        "junit", "testng", "mockito", "selenium", "cypress", "jest", "mocha", "chai", "jasmine",
        "karma", "protractor", "cucumber", "postman", "insomnia", "swagger", "rest assured",
        "pytest", "unittest", "robot framework", "jmeter", "loadrunner", "gatling", "k6"
    );
    
    private static final Set<String> DEVOPS_TOOLS = Set.of(
        "git", "github", "gitlab", "bitbucket", "svn", "mercurial", "jenkins", "bamboo", "teamcity",
        "azure devops", "circleci", "travis ci", "github actions", "docker", "podman", "kubernetes",
        "helm", "istio", "prometheus", "grafana", "elk stack", "splunk", "datadog", "new relic"
    );
    
    private static final Set<String> DESIGN_TOOLS = Set.of(
        "photoshop", "illustrator", "sketch", "figma", "adobe xd", "invision", "zeplin", "principle",
        "framer", "after effects", "premiere pro", "canva", "gimp", "inkscape", "blender", "maya",
        "3ds max", "autocad", "solidworks", "ui/ux", "user experience", "user interface", "wireframing",
        "prototyping", "responsive design", "accessibility", "usability testing"
    );
    
    private static final Set<String> PROJECT_MANAGEMENT = Set.of(
        "jira", "confluence", "trello", "asana", "monday.com", "notion", "slack", "microsoft teams",
        "zoom", "agile", "scrum", "kanban", "waterfall", "lean", "six sigma", "pmp", "prince2",
        "project management", "product management", "stakeholder management", "risk management"
    );
    
    private static final Set<String> SECURITY_TOOLS = Set.of(
        "owasp", "burp suite", "metasploit", "nmap", "wireshark", "kali linux", "penetration testing",
        "vulnerability assessment", "security audit", "encryption", "ssl/tls", "oauth", "jwt",
        "saml", "ldap", "active directory", "iam", "firewall", "intrusion detection", "siem"
    );
    
    // Combined skill set for fast lookup
    private static final Set<String> ALL_SKILLS;
    
    static {
        Set<String> allSkills = new HashSet<>();
        allSkills.addAll(PROGRAMMING_LANGUAGES);
        allSkills.addAll(FRAMEWORKS_LIBRARIES);
        allSkills.addAll(DATABASES);
        allSkills.addAll(CLOUD_TECHNOLOGIES);
        allSkills.addAll(DATA_SCIENCE_ML);
        allSkills.addAll(MOBILE_TECHNOLOGIES);
        allSkills.addAll(TESTING_TOOLS);
        allSkills.addAll(DEVOPS_TOOLS);
        allSkills.addAll(DESIGN_TOOLS);
        allSkills.addAll(PROJECT_MANAGEMENT);
        allSkills.addAll(SECURITY_TOOLS);
        ALL_SKILLS = Collections.unmodifiableSet(allSkills);
    }
    
    // Common words to exclude
    private static final Set<String> COMMON_WORDS = Set.of(
        "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
        "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "will", "would", "could", "should", "may", "might",
        "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
        "me", "him", "her", "us", "them", "my", "your", "his", "its", "our", "their",
        "experience", "skills", "knowledge", "ability", "expertise", "proficiency",
        "strong", "excellent", "good", "great", "high", "low", "basic", "advanced",
        "required", "preferred", "necessary", "essential", "important", "key", "work",
        "working", "worked", "project", "projects", "developed", "development", "using",
        "used", "including", "include", "such", "as", "well", "also", "various", "multiple"
    );
    
    private static final Pattern WORD_PATTERN = Pattern.compile("\\b\\w+\\b");
    private static final Pattern MULTI_WORD_PATTERN = Pattern.compile("\\b\\w+(?:\\s+\\w+){1,3}\\b");

    @Override
    public List<String> extractSkills(String text) {
        logger.debug("Starting fast skill extraction...");
        long startTime = System.currentTimeMillis();
        
        if (text == null || text.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        String normalizedText = text.toLowerCase();
        Set<String> extractedSkills = new HashSet<>();
        
        // Extract multi-word skills first (e.g., "spring boot", "react native")
        extractedSkills.addAll(extractMultiWordSkills(normalizedText));
        
        // Extract single-word skills
        extractedSkills.addAll(extractSingleWordSkills(normalizedText));
        
        // Extract version-specific skills (e.g., "Java 8", "Python 3.9")
        extractedSkills.addAll(extractVersionedSkills(normalizedText));
        
        // Extract abbreviated skills (e.g., "JS" for JavaScript, "CSS3")
        extractedSkills.addAll(extractAbbreviatedSkills(normalizedText));
        
        List<String> result = extractedSkills.stream()
            .filter(skill -> skill.length() > 1)
            .sorted()
            .collect(Collectors.toList());
        
        long endTime = System.currentTimeMillis();
        logger.debug("Fast skill extraction completed in {}ms, found {} skills", (endTime - startTime), result.size());
        
        return result;
    }
    
    private Set<String> extractMultiWordSkills(String text) {
        Set<String> skills = new HashSet<>();
        
        // Look for exact multi-word matches
        for (String skill : ALL_SKILLS) {
            if (skill.contains(" ") && text.contains(skill)) {
                skills.add(formatSkillName(skill));
            }
        }
        
        return skills;
    }
    
    private Set<String> extractSingleWordSkills(String text) {
        Set<String> skills = new HashSet<>();
        
        String[] words = text.split("\\s+");
        for (String word : words) {
            String cleanWord = cleanWord(word);
            if (ALL_SKILLS.contains(cleanWord)) {
                skills.add(formatSkillName(cleanWord));
            }
        }
        
        return skills;
    }
    
    private Set<String> extractVersionedSkills(String text) {
        Set<String> skills = new HashSet<>();
        
        // Pattern for versioned technologies (e.g., "Java 8", "Python 3.9", "Angular 12")
        Pattern versionPattern = Pattern.compile("\\b(\\w+)\\s+\\d+(?:\\.\\d+)*\\b");
        java.util.regex.Matcher matcher = versionPattern.matcher(text);
        
        while (matcher.find()) {
            String baseSkill = matcher.group(1).toLowerCase();
            if (ALL_SKILLS.contains(baseSkill)) {
                skills.add(formatSkillName(baseSkill));
            }
        }
        
        return skills;
    }
    
    private Set<String> extractAbbreviatedSkills(String text) {
        Set<String> skills = new HashSet<>();
        
        // Common abbreviations mapping
        Map<String, String> abbreviations = Map.of(
            "js", "javascript",
            "ts", "typescript",
            "css3", "css",
            "html5", "html",
            "db", "database",
            "api", "api",
            "ui", "user interface",
            "ux", "user experience"
        );
        
        for (Map.Entry<String, String> entry : abbreviations.entrySet()) {
            if (text.contains(entry.getKey())) {
                skills.add(formatSkillName(entry.getValue()));
            }
        }
        
        return skills;
    }
    
    private String cleanWord(String word) {
        return word.replaceAll("[^a-zA-Z]", "").toLowerCase();
    }
    
    private String formatSkillName(String skill) {
        // Capitalize first letter of each word
        return Arrays.stream(skill.split("\\s+"))
            .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
            .collect(Collectors.joining(" "));
    }

    @Override
    public double computeSimilarity(String text1, String text2) {
        // Fast local similarity computation using Jaccard similarity
        if (text1 == null || text2 == null) {
            return 0.0;
        }
        
        Set<String> words1 = Arrays.stream(text1.toLowerCase().split("\\s+"))
            .filter(word -> word.length() > 2 && !COMMON_WORDS.contains(word))
            .collect(Collectors.toSet());
            
        Set<String> words2 = Arrays.stream(text2.toLowerCase().split("\\s+"))
            .filter(word -> word.length() > 2 && !COMMON_WORDS.contains(word))
            .collect(Collectors.toSet());
        
        Set<String> intersection = new HashSet<>(words1);
        intersection.retainAll(words2);
        
        Set<String> union = new HashSet<>(words1);
        union.addAll(words2);
        
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    @Override
    public void testAPI() {
        logger.info("Fast skill extraction service - no external API required");
        
        // Test with sample text
        String testText = "I have experience with Java, Spring Boot, React, and AWS. I've worked on machine learning projects using Python and TensorFlow.";
        List<String> skills = extractSkills(testText);
        logger.info("Test extraction found {} skills: {}", skills.size(), skills);
        
        // Test similarity
        double similarity = computeSimilarity("Java Spring Boot developer", "Senior Java developer with Spring experience");
        logger.info("Test similarity: {}", similarity);
    }
}
