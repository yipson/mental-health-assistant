package com.mentalhealth.assistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_name",
            nullable = false)
    private String patientName;

    @Column(name = "date",
            nullable = false)
    private LocalDateTime date;

    @Column(name = "duration",
            nullable = false)
    private Integer duration; // in minutes

    @Enumerated(EnumType.STRING)
    @Column(name = "status",
            nullable = false)
    private SessionStatus status;

    private String notes;

    @Column(name = "recording_url")
    private String recordingUrl;

    @Column(name = "transcription_id")
    private String transcriptionId;

    @Column(name = "summary_id")
    private String summaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
