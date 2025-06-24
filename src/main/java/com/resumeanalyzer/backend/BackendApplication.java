package com.resumeanalyzer.backend;

import com.resumeanalyzer.backend.service.SkillExtractionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@SpringBootApplication
@RequiredArgsConstructor
public class BackendApplication {
	private static final Logger logger = LoggerFactory.getLogger(BackendApplication.class);
	private final SkillExtractionService skillExtractionService;

	@PostConstruct
	public void init() {
		try {
			skillExtractionService.testAPI();
			logger.info("Hugging Face API is working correctly!");
		} catch (Exception e) {
			logger.error("Hugging Face API test failed: {}", e.getMessage());
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}
