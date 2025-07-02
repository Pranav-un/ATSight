package com.resumeanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UploadProgressDTO {
    private String status; // "PROCESSING", "COMPLETED", "ERROR"
    private int processedCount;
    private int totalCount;
    private String currentFile;
    private String message;
    private Long leaderboardId;
    
    public static UploadProgressDTO processing(int processed, int total, String currentFile) {
        return new UploadProgressDTO("PROCESSING", processed, total, currentFile, 
            "Processing " + currentFile + " (" + processed + "/" + total + ")", null);
    }
    
    public static UploadProgressDTO completed(Long leaderboardId, int total) {
        return new UploadProgressDTO("COMPLETED", total, total, null, 
            "Upload completed successfully", leaderboardId);
    }
    
    public static UploadProgressDTO error(String message) {
        return new UploadProgressDTO("ERROR", 0, 0, null, message, null);
    }
}
