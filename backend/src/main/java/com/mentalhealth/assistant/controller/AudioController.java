package com.mentalhealth.assistant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mentalhealth.assistant.dto.AudioChunkResponse;
import com.mentalhealth.assistant.service.AudioService;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;

// @CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/audio")
public class AudioController {

    @Autowired
    private AudioService audioService;

    @PostMapping(value = "/upload-chunk"
    , consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<String> uploadAudioChunk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sessionId") Long sessionId,
            @RequestParam("chunkIndex") Integer chunkIndex,
            @RequestParam("isLastChunk") Boolean isLastChunk
            ) {
        
        try {
            audioService.storeAudioChunk(file, sessionId, chunkIndex, isLastChunk);
            return ResponseEntity.ok("Chunk uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading chunk: " + e.getMessage());
        }
    }
    
}