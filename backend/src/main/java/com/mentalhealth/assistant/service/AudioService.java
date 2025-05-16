package com.mentalhealth.assistant.service;

import com.mentalhealth.assistant.dto.AudioChunkResponse;
import com.mentalhealth.assistant.model.Audio;
import com.mentalhealth.assistant.model.Session;
import com.mentalhealth.assistant.repository.AudioRepository;
import com.mentalhealth.assistant.repository.SessionRepository;
import com.mentalhealth.assistant.exception.AudioProcessingException;
import com.mentalhealth.assistant.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AudioService {
    
    @Autowired
    private AudioRepository audioRepository;
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Value("${app.audio.upload.dir}")
    private String uploadDir;
    
    public AudioChunkResponse storeAudioChunk(MultipartFile chunk, Long sessionId, 
            Integer chunkIndex, boolean isLastChunk) {
        try {
            // Create chunks directory if it doesn't exist
            String chunksDir = uploadDir + "/" + sessionId;
            Files.createDirectories(Paths.get(chunksDir));
            
            // Generate unique filename for the chunk
            String chunkFilename = String.format("%s_chunk_%d.webm", sessionId, chunkIndex);
            Path chunkPath = Paths.get(chunksDir, chunkFilename);
            
            // Save the chunk file
            Files.write(chunkPath, chunk.getBytes());
            
            // Save chunk metadata to database
            Audio audioChunk = new Audio();
            audioChunk.setFilename(chunkFilename);
            audioChunk.setContentType(chunk.getContentType());
            audioChunk.setPath(chunkPath.toString());
            audioChunk.setChunkIndex(chunkIndex);
            audioChunk.setLastChunk(isLastChunk);
            
            Optional<Session> sessionOptional = sessionRepository.findById(sessionId);
            if (sessionOptional.isPresent()) {
                audioChunk.setSession(sessionOptional.get());
            } else {
                throw new ResourceNotFoundException("Session not found");
            }
            
            audioRepository.save(audioChunk);
            
            // If this is the last chunk, merge all chunks
            if (isLastChunk) {
                mergeChunks(sessionId);
            }
            
            return new AudioChunkResponse(true, chunkFilename, chunkIndex, isLastChunk);
            
        } catch (IOException e) {
            throw new AudioProcessingException("Failed to store audio chunk: " + e.getMessage(), e);
        }
    }
    
    private void mergeChunks(Long sessionId) {
        try {
            List<Audio> chunks = audioRepository.findBySessionIdOrderByChunkIndex(sessionId);
            if (chunks.isEmpty()) {
                return;
            }
            
            // Create final audio file
            String finalFilename = sessionId + "_complete.webm";
            Path finalPath = Paths.get(uploadDir, finalFilename);
            
            // Merge all chunks
            try (var outputStream = Files.newOutputStream(finalPath)) {
                for (Audio chunk : chunks) {
                    byte[] chunkData = Files.readAllBytes(Paths.get(chunk.getPath()));
                    outputStream.write(chunkData);
                }
            }
            
            // Create final audio entry
            Audio finalAudio = new Audio();
            finalAudio.setFilename(finalFilename);
            finalAudio.setContentType("audio/webm");
            finalAudio.setPath(finalPath.toString());
            finalAudio.setChunkIndex(-1); // Indicates this is the merged file
            finalAudio.setLastChunk(true);
            finalAudio.setSession(chunks.get(0).getSession());
            
            audioRepository.save(finalAudio);
            
            // Optionally cleanup chunks
            cleanupChunks(chunks);
            
        } catch (IOException e) {
            throw new AudioProcessingException("Failed to merge audio chunks: " + e.getMessage(), e);
        }
    }
    
    private void cleanupChunks(List<Audio> chunks) {
        for (Audio chunk : chunks) {
            try {
                Files.deleteIfExists(Paths.get(chunk.getPath()));
                audioRepository.delete(chunk);
            } catch (IOException e) {
                throw new AudioProcessingException("Failed to cleanup chunk: " + chunk.getPath(), e);
            }
        }
    }
}