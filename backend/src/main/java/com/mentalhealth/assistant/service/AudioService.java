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
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AudioService {
    
    private static final Logger logger = LoggerFactory.getLogger(AudioService.class);
    
    @Autowired
    private AudioRepository audioRepository;
    
    @Autowired
    private SessionRepository sessionRepository;
    
    @Value("${app.audio.upload.dir}")
    private String uploadDir;
    
    public void storeAudioChunk(MultipartFile chunk, Long sessionId, 
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
                logger.info("Last chunk received for session: " + sessionId);
            }
            
            logger.info("Stored audio chunk #" + chunkIndex + " for session " + sessionId + ", isLastChunk=" + isLastChunk);
            
        } catch (IOException e) {
            logger.error("Failed to store audio chunk: " + e.getMessage(), e);
            throw new AudioProcessingException("Failed to store audio chunk: " + e.getMessage(), e);
        }
    }
    
    private void mergeChunks(Long sessionId) {
        try {
            List<Audio> chunks = audioRepository.findBySessionIdOrderByChunkIndex(sessionId);
            if (chunks.isEmpty()) {
                logger.warn("No chunks found for session: " + sessionId);
                return;
            }
            
            logger.info("Found " + chunks.size() + " chunks to merge for session: " + sessionId);
            
            // Create final audio file path
            String finalFilename = sessionId + "_complete.webm";
            Path finalPath = Paths.get(uploadDir, finalFilename);
            
            boolean mergeSuccessful = false;
            
            // Try to merge using FFmpeg first
            try {
                mergeSuccessful = mergeWithFFmpeg(chunks, finalPath);
            } catch (Exception e) {
                logger.warn("Failed to merge with FFmpeg: " + e.getMessage() + ". Falling back to simple concatenation.");
            }
            
            // If FFmpeg failed, fall back to simple concatenation
            if (!mergeSuccessful) {
                try {
                    mergeWithSimpleConcatenation(chunks, finalPath);
                    mergeSuccessful = true;
                } catch (Exception e) {
                    logger.error("Simple concatenation also failed: " + e.getMessage(), e);
                }
            }
            
            if (mergeSuccessful) {
                logger.info("Successfully merged " + chunks.size() + " chunks for session " + sessionId);
                
                // Create final audio entry
                Audio finalAudio = new Audio();
                finalAudio.setFilename(finalFilename);
                finalAudio.setContentType("audio/webm");
                finalAudio.setPath(finalPath.toString());
                finalAudio.setChunkIndex(-1); // Indicates this is the merged file
                finalAudio.setLastChunk(true);
                finalAudio.setSession(chunks.get(0).getSession());
                
                audioRepository.save(finalAudio);
                

                cleanupChunks(chunks); // Comentado para depuración
            } else {
                logger.error("Failed to merge chunks for session " + sessionId + " using both methods");
            }
        } catch (Exception e) {
            logger.error("Error in mergeChunks: " + e.getMessage(), e);
        }
    }
    
    /**
     * Intenta fusionar chunks de audio usando FFmpeg
     * @param chunks Lista de chunks de audio a fusionar
     * @param outputPath Ruta donde se guardará el archivo final
     * @return true si la fusión fue exitosa, false en caso contrario
     */
    private boolean mergeWithFFmpeg(List<Audio> chunks, Path outputPath) throws IOException {
        logger.info("Attempting to merge with FFmpeg");
        
        // Asegurar que los chunks estén ordenados por índice
        chunks.sort((a, b) -> a.getChunkIndex().compareTo(b.getChunkIndex()));
        
        // Crear un archivo temporal con la lista de chunks para FFmpeg
        Path chunkListFile = Files.createTempFile("chunks_", ".txt");
        
        try {
            // Escribir la lista de archivos en el formato que FFmpeg espera
            List<String> lines = chunks.stream()
                .map(chunk -> "file '" + chunk.getPath().replace("\\", "/") + "'")
                .collect(Collectors.toList());
            
            Files.write(chunkListFile, lines);
            
            logger.info("Created chunk list file at: " + chunkListFile);
            
            // Construir comando FFmpeg
            ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", chunkListFile.toString(),
                "-c", "copy",
                outputPath.toString()
            );
            
            // Ejecutar el proceso
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            
            // Capturar salida estándar y de error
            String output = new String(process.getInputStream().readAllBytes());
            String error = new String(process.getErrorStream().readAllBytes());
            
            if (exitCode == 0) {
                logger.info("FFmpeg merge successful");
                return true;
            } else {
                logger.warn("FFmpeg failed with exit code " + exitCode);
                logger.warn("FFmpeg output: " + output);
                logger.warn("FFmpeg error: " + error);
                return false;
            }
        } catch (InterruptedException e) {
            logger.error("FFmpeg process was interrupted", e);
            Thread.currentThread().interrupt();
            return false;
        } finally {
            // Limpiar archivo temporal
            try {
                Files.deleteIfExists(chunkListFile);
            } catch (IOException e) {
                logger.warn("Could not delete temporary file: " + chunkListFile, e);
            }
        }
    }
    
    /**
     * Fusiona chunks de audio usando concatenación simple
     * Este método es un respaldo cuando FFmpeg no está disponible
     * @param chunks Lista de chunks de audio a fusionar
     * @param outputPath Ruta donde se guardará el archivo final
     */
    private void mergeWithSimpleConcatenation(List<Audio> chunks, Path outputPath) throws IOException {
        logger.info("Using simple concatenation to merge audio chunks - total chunks: " + chunks.size());
        
        // Asegurar que los chunks estén ordenados por índice
        chunks.sort((a, b) -> a.getChunkIndex().compareTo(b.getChunkIndex()));
        
        try (var outputStream = Files.newOutputStream(outputPath)) {
            // Con el nuevo enfoque, simplemente concatenamos todos los chunks en orden
            // ya que provienen de una única grabación continua
            for (Audio chunk : chunks) {
                Path chunkPath = Paths.get(chunk.getPath());
                if (!Files.exists(chunkPath)) {
                    logger.warn("Chunk file does not exist: " + chunkPath);
                    continue;
                }
                
                byte[] chunkData = Files.readAllBytes(chunkPath);
                logger.info("Processing chunk #" + chunk.getChunkIndex() + ", size: " + chunkData.length + " bytes");
                
                // Escribir los datos del chunk directamente
                outputStream.write(chunkData);
                logger.info("Wrote chunk data: " + chunk.getPath() + ", size: " + chunkData.length + " bytes");
            }
        }
        
        logger.info("Completed simple concatenation of audio chunks to: " + outputPath);
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