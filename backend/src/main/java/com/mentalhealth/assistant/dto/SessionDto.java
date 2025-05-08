package com.mentalhealth.assistant.dto;

import com.mentalhealth.assistant.model.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionDto {
    private Long id;
    private String patientName;
    private LocalDateTime date;
    private Integer duration;
    private SessionStatus status;
    private String notes;
    private String recordingUrl;
    private String transcriptionId;
    private String summaryId;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
