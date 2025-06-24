package com.resumeanalyzer.backend.service.impl;

import com.resumeanalyzer.backend.service.SkillExtractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillExtractionServiceImpl implements SkillExtractionService {
    @Value("${huggingface.api.token}")
    private String hfToken;

    private static final String NER_API_URL = "https://api-inference.huggingface.co/models/dslim/bert-base-NER";
    private static final String SIMILARITY_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

    private static final Logger logger = LoggerFactory.getLogger(SkillExtractionServiceImpl.class);

    @Override
    public List<String> extractSkills(String text) {
        try {
            // Use a more sophisticated approach with text classification
            // First, let's try using a zero-shot classification model to identify skills
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(hfToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            // Use a zero-shot classification model to identify skill-related text
            String zeroShotUrl = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
            
            // Define candidate labels for skills across different sectors
            List<String> candidateLabels = Arrays.asList(
                "technical skill", "programming language", "software tool", "framework", "database",
                "medical skill", "healthcare procedure", "clinical expertise", "medical certification",
                "financial skill", "accounting software", "financial analysis", "investment knowledge",
                "marketing skill", "digital marketing", "social media", "content creation",
                "design skill", "graphic design", "UI/UX design", "creative software",
                "management skill", "leadership", "project management", "team coordination",
                "language skill", "communication", "presentation", "negotiation",
                "analytical skill", "data analysis", "research", "problem solving"
            );
            
            Map<String, Object> requestBody = Map.of(
                "inputs", text,
                "parameters", Map.of("candidate_labels", candidateLabels)
            );
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            RestTemplate restTemplate = new RestTemplate();
            
            ResponseEntity<Map> response = restTemplate.postForEntity(zeroShotUrl, request, Map.class);
            Map<String, Object> result = response.getBody();
            
            if (result != null && result.containsKey("labels") && result.containsKey("scores")) {
                List<String> labels = (List<String>) result.get("labels");
                List<Double> scores = (List<Double>) result.get("scores");
                
                // Extract high-confidence skill-related labels
                List<String> identifiedSkills = new ArrayList<>();
                for (int i = 0; i < labels.size() && i < scores.size(); i++) {
                    if (scores.get(i) > 0.3) { // Threshold for confidence
                        identifiedSkills.add(labels.get(i));
                    }
                }
                
                // Now extract specific skill terms using NER with better filtering
                List<String> specificSkills = extractSpecificSkillTerms(text);
                identifiedSkills.addAll(specificSkills);
                
                return cleanAndFilterSkills(identifiedSkills);
            }
            
            // Fallback to NER if zero-shot fails
            return cleanAndFilterSkills(extractSpecificSkillTerms(text));
            
        } catch (Exception e) {
            logger.error("Error in skill extraction: {}", e.getMessage());
            // Fallback to basic keyword extraction
            return cleanAndFilterSkills(extractBasicSkills(text));
        }
    }
    
    private List<String> extractSpecificSkillTerms(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(hfToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("inputs", text), headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<List> response = restTemplate.postForEntity(NER_API_URL, request, List.class);
            
            List<Map<String, Object>> entities = response.getBody();
            if (entities != null) {
                return entities.stream()
                        .filter(e -> {
                            String entityGroup = (String) e.get("entity_group");
                            String word = (String) e.get("word");
                            double score = (Double) e.get("score");
                            
                            // Filter for high-confidence entities that could be skills
                            return (entityGroup != null && 
                                   (entityGroup.equals("MISC") || entityGroup.equals("ORG") || entityGroup.equals("PRODUCT"))) &&
                                   score > 0.5 && 
                                   word != null && 
                                   word.length() > 2;
                        })
                        .map(e -> (String) e.get("word"))
                        .distinct()
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            logger.error("Error in NER skill extraction: {}", e.getMessage());
        }
        return new ArrayList<>();
    }
    
    private List<String> extractBasicSkills(String text) {
        // Enhanced basic extraction: look for capitalized terms and common skill patterns
        String[] words = text.split("\\s+");
        List<String> potentialSkills = new ArrayList<>();
        
        for (String word : words) {
            // Clean the word
            String cleanWord = word.replaceAll("[^a-zA-Z]", "").trim();
            
            // Check if it looks like a skill (capitalized, reasonable length, no numbers)
            if (cleanWord.length() > 2 && 
                cleanWord.matches(".*[A-Z].*") && 
                !cleanWord.matches(".*\\d.*") &&
                !isCommonWord(cleanWord)) {
                potentialSkills.add(cleanWord);
            }
        }
        
        return potentialSkills.stream()
                .distinct()
                .limit(30) // Limit to top 30 potential skills
                .collect(Collectors.toList());
    }
    
    private List<String> cleanAndFilterSkills(List<String> skills) {
        return skills.stream()
                .map(this::cleanSkill)
                .filter(skill -> skill.length() > 2 && !isCommonWord(skill))
                .distinct()
                .collect(Collectors.toList());
    }
    
    private String cleanSkill(String skill) {
        // Remove tokenization artifacts and clean up the skill name
        return skill.replaceAll("##", "")  // Remove ## prefixes
                   .replaceAll("[^a-zA-Z\\s]", "")  // Keep only letters and spaces
                   .trim()
                   .replaceAll("\\s+", " ");  // Normalize spaces
    }
    
    private boolean isCommonWord(String word) {
        // List of common words that shouldn't be considered skills
        Set<String> commonWords = Set.of(
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "will", "would", "could", "should", "may", "might",
            "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
            "me", "him", "her", "us", "them", "my", "your", "his", "its", "our", "their",
            "experience", "skills", "knowledge", "ability", "expertise", "proficiency",
            "strong", "excellent", "good", "great", "high", "low", "basic", "advanced",
            "required", "preferred", "necessary", "essential", "important", "key"
        );
        return commonWords.contains(word.toLowerCase());
    }

    @Override
    public double computeSimilarity(String text1, String text2) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(hfToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        Map<String, Object> inputs = Map.of("source_sentence", text1, "sentences", List.of(text2));
        HttpEntity<Map<String, Map<String, Object>>> request = new HttpEntity<>(Map.of("inputs", inputs), headers);

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<double[]> response = restTemplate.postForEntity(SIMILARITY_API_URL, request, double[].class);
        
        double[] scores = response.getBody();
        if (scores == null || scores.length == 0) {
            throw new RuntimeException("Invalid similarity score received from API");
        }
        return scores[0];
    }

    @Override
    public void testAPI() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(hfToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            Map<String, Object> inputs = Map.of("source_sentence", "This is a test.", "sentences", List.of("This is another test."));
            HttpEntity<Map<String, Map<String, Object>>> request = new HttpEntity<>(Map.of("inputs", inputs), headers);
            
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<double[]> response = restTemplate.postForEntity(SIMILARITY_API_URL, request, double[].class);
            
            double[] scores = response.getBody();
            if (scores != null && scores.length > 0) {
                logger.info("Hugging Face API test succeeded. Score: {}", scores[0]);
            } else {
                logger.error("Hugging Face API test failed: Unexpected response structure");
            }
        } catch (Exception e) {
            logger.error("Hugging Face API test failed: {}", e.getMessage(), e);
            throw new RuntimeException("Hugging Face API test failed", e);
        }
    }
} 