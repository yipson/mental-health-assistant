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
import java.util.ArrayList;
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

    @Autowired
    private S3Service s3Service;

    @Value("${app.audio.upload.dir}")
    private String uploadDir;

    /**
     * Stores an audio chunk, optimized for S3 storage only
     * @param chunk The audio chunk file
     * @param sessionId The session ID
     * @param chunkIndex The index of the chunk
     * @param isLastChunk Whether this is the last chunk
     */
    public void storeAudioChunk(MultipartFile chunk, Long sessionId, 
            Integer chunkIndex, boolean isLastChunk) {
        try {
            logger.info("Processing audio chunk #{} for session {}, isLastChunk={}", chunkIndex, sessionId, isLastChunk);

            // Generate unique filename for the chunk
            String chunkFilename = String.format("%s_chunk_%d.webm", sessionId, chunkIndex);
            String s3Key = "audio/" + sessionId + "/chunks/" + chunkFilename;

            // Save chunk metadata to database first
            Audio audioChunk = new Audio();
            audioChunk.setFilename(chunkFilename);
            audioChunk.setContentType(chunk.getContentType());
            audioChunk.setChunkIndex(chunkIndex);
            audioChunk.setLastChunk(isLastChunk);

            // Upload directly to S3 without saving to local filesystem
            try {
                // Upload directly from the MultipartFile bytes to S3
                String s3Url = s3Service.uploadFileFromBytes(chunk.getBytes(), s3Key, chunk.getContentType());
                audioChunk.setS3Url(s3Url);
                audioChunk.setPath("s3://" + s3Key); // Store the S3 path reference
                logger.info("Uploaded audio chunk directly to S3: {}", s3Url);
            } catch (Exception e) {
                logger.error("Failed to upload chunk to S3: {}", e.getMessage(), e);
                throw new AudioProcessingException("Failed to upload audio chunk to S3: " + e.getMessage(), e);
            }

            // Associate with session
            Optional<Session> sessionOptional = sessionRepository.findById(sessionId);
            if (sessionOptional.isPresent()) {
                audioChunk.setSession(sessionOptional.get());
            } else {
                throw new ResourceNotFoundException("Session not found");
            }

            // Save to database
            audioRepository.save(audioChunk);

            // If this is the last chunk, merge all chunks
            if (isLastChunk) {
                mergeChunksFromS3(sessionId, chunkIndex + 1);
                logger.info("Last chunk received for session: {}, initiating merge", sessionId);
            }

        } catch (Exception e) {
            logger.error("Failed to store audio chunk: {}", e.getMessage(), e);
            throw new AudioProcessingException("Failed to store audio chunk: " + e.getMessage(), e);
        }
    }

    // This method is now deprecated in favor of mergeChunksFromS3
    // Kept for backwards compatibility but not used in new code
    private void mergeChunks(Long sessionId) {
        // Simply delegate to the S3-only implementation
        String s3Url = mergeChunksFromS3(sessionId, -1); // -1 means use all chunks found in the database
        logger.info("Merged audio available at: {}", s3Url);
    }
    
    /**
     * Merges audio chunks directly from S3
     * Optimized for S3-only storage without local file dependencies
     * @param sessionId The session ID
     * @param chunkCount The number of chunks to merge, or -1 to use all chunks found in database
     * @return The S3 URL of the merged file
     */
    public String mergeChunksFromS3(Long sessionId, int chunkCount) {
        try {
            logger.info("Merging {} chunks from S3 for session {}", chunkCount, sessionId);
            
            // First check if merged file already exists in database to avoid redundant operations
            List<Audio> existingMergedFiles = audioRepository.findBySessionIdAndChunkIndex(sessionId, Integer.valueOf(-1));
            if (!existingMergedFiles.isEmpty()) {
                Audio mergedFile = existingMergedFiles.get(0);
                if (mergedFile.getS3Url() != null) {
                    // Merged file already exists in S3, just download it if needed
                    String finalFilename = sessionId + "_complete.webm";
                    Path finalPath = Paths.get(uploadDir, finalFilename);
                    
                    if (!Files.exists(finalPath)) {
                        // Download only if local file doesn't exist
                        s3Service.downloadFile(mergedFile.getS3Url(), finalPath);
                        logger.info("Downloaded existing merged file from S3: {}", mergedFile.getS3Url());
                    } else {
                        logger.info("Using existing local merged file: {}", finalPath);
                    }
                    
                    return null;
                }
            }

            // Create temporary directory for downloaded chunks
            Path tempDir = Files.createTempDirectory("s3_chunks_" + sessionId);

            // Define final filename
            String finalFilename = sessionId + "_complete.webm";
            Path tempFinalPath = tempDir.resolve(finalFilename);

            // Check if we can use database records to get S3 URLs
            List<Audio> dbChunks = audioRepository.findBySessionIdOrderByChunkIndex(sessionId);
            List<Path> chunkPaths = new ArrayList<>();
            
            if (!dbChunks.isEmpty() && dbChunks.size() >= chunkCount) {
                // Use database records for S3 URLs
                logger.info("Using {} database records for S3 URLs", dbChunks.size());
                
                for (Audio chunk : dbChunks) {
                    if (chunk.getChunkIndex() >= 0 && chunk.getS3Url() != null) { // Skip merged file
                        String chunkFilename = chunk.getFilename();
                        Path localPath = tempDir.resolve(chunkFilename);
                        
                        try {
                            s3Service.downloadFile(chunk.getS3Url(), localPath);
                            chunkPaths.add(localPath);
                            logger.info("Downloaded chunk from S3 using DB record: {}", chunk.getS3Url());
                        } catch (Exception e) {
                            logger.warn("Failed to download chunk {}: {}", chunk.getChunkIndex(), e.getMessage());
                        }
                    }
                }
            } else {
                // Fallback to direct S3 access without database
                logger.info("Falling back to direct S3 access without database");
                
                for (int i = 0; i < chunkCount; i++) {
                    String chunkFilename = String.format("%s_chunk_%d.webm", sessionId, i);
                    String s3Key = "audio/" + sessionId + "/chunks/" + chunkFilename;
                    
                    // Construct the S3 URL
                    String s3Url = "https://" + s3Service.getBucketName() + ".s3.amazonaws.com/" + s3Key;
                    
                    // Download to temp directory
                    Path localPath = tempDir.resolve(chunkFilename);
                    try {
                        s3Service.downloadFile(s3Url, localPath);
                        chunkPaths.add(localPath);
                        logger.info("Downloaded chunk from S3 directly: {}", s3Url);
                    } catch (Exception e) {
                        logger.warn("Failed to download chunk {}: {}", i, e.getMessage());
                    }
                }
            }
            
            if (chunkPaths.isEmpty()) {
                logger.warn("No chunks could be downloaded for session: {}", sessionId);
                return null;
            }
            
            // Sort chunks by index (which is embedded in the filename)
            chunkPaths.sort((a, b) -> {
                String aName = a.getFileName().toString();
                String bName = b.getFileName().toString();
                int aIndex = Integer.parseInt(aName.substring(aName.lastIndexOf('_') + 1, aName.lastIndexOf('.')));
                int bIndex = Integer.parseInt(bName.substring(bName.lastIndexOf('_') + 1, bName.lastIndexOf('.')));
                return Integer.compare(aIndex, bIndex);
            });

            // Try to merge using FFmpeg first
            boolean mergeSuccessful = false;
            try {
                mergeSuccessful = mergeWithFFmpeg(chunkPaths, tempFinalPath);
            } catch (Exception e) {
                logger.warn("Failed to merge with FFmpeg: {}. Falling back to simple concatenation.", e.getMessage());
            }

            // If FFmpeg failed, fall back to simple concatenation
            if (!mergeSuccessful) {
                try {
                    mergeWithSimpleConcatenation(chunkPaths, tempFinalPath);
                    mergeSuccessful = true;
                } catch (Exception e) {
                    logger.error("Simple concatenation also failed: {}", e.getMessage(), e);
                }
            }

            if (mergeSuccessful) {
                logger.info("Successfully merged {} chunks for session {}", chunkPaths.size(), sessionId);

                // Create or update the merged file record in database
                Audio mergedAudio = null;
                if (!existingMergedFiles.isEmpty()) {
                    mergedAudio = existingMergedFiles.get(0);
                } else {
                    mergedAudio = new Audio();
                    mergedAudio.setFilename(finalFilename);
                    mergedAudio.setContentType("audio/webm");
                    mergedAudio.setChunkIndex(-1); // Indicates this is the merged file
                    mergedAudio.setLastChunk(true);
                    
                    // Get session from database
                    Optional<Session> sessionOpt = sessionRepository.findById(sessionId);
                    if (sessionOpt.isPresent()) {
                        mergedAudio.setSession(sessionOpt.get());
                    } else {
                        logger.warn("Session not found for ID: {}", sessionId);
                    }
                }

                // Upload the merged file to S3
                String s3Url = null;
                try {
                    String s3Key = "audio/" + sessionId + "/" + finalFilename;
                    s3Url = s3Service.uploadFile(tempFinalPath, s3Key);
                    mergedAudio.setS3Url(s3Url);
                    mergedAudio.setPath("s3://" + s3Key); // Store S3 path reference instead of local path
                    logger.info("Uploaded merged audio file to S3: {}", s3Url);

                } catch (Exception e) {
                    logger.error("Failed to upload merged audio to S3: {}", e.getMessage());
                    throw new AudioProcessingException("Failed to upload merged audio to S3", e);
                }

                // Save or update the merged file record
                audioRepository.save(mergedAudio);

                // Clean up temporary files
                for (Path path : chunkPaths) {
                    try {
                        Files.deleteIfExists(path);
                    } catch (IOException e) {
                        logger.warn("Failed to delete temporary file: {}", path);
                    }
                }
                
                try {
                    Files.deleteIfExists(tempFinalPath);
                    Files.deleteIfExists(tempDir);
                } catch (IOException e) {
                    logger.warn("Failed to delete temporary directory: {}", tempDir);
                }
                
                // Clean up S3 chunk files to save storage costs
                // Only do this if we have successfully created the merged file
                if (s3Url != null) {
                    cleanupChunksFromS3(dbChunks.stream()
                        .filter(chunk -> chunk.getChunkIndex() >= 0) // Only cleanup chunks, not merged file
                        .collect(Collectors.toList()));
                }
                
                return s3Url;
            } else {
                logger.error("Failed to merge chunks for session {} using both methods", sessionId);
                throw new AudioProcessingException("Failed to merge audio chunks from S3");
            }
        } catch (Exception e) {
            logger.error("Error in mergeChunksFromS3: {}", e.getMessage(), e);
            throw new AudioProcessingException("Error merging audio chunks from S3: " + e.getMessage(), e);
        }
    }

    /**
     * Merges audio chunks using FFmpeg
     * @param chunkPaths List of paths to audio chunks
     * @param outputPath Path where the merged file will be saved
     * @return true if the merge was successful, false otherwise
     */
    private boolean mergeWithFFmpeg(List<Path> chunkPaths, Path outputPath) throws IOException {
        logger.info("Attempting to merge with FFmpeg");

        // Create a temporary file with the list of chunks for FFmpeg
        Path chunkListFile = Files.createTempFile("chunks_", ".txt");

        try {
            // Write the list of files in the format that FFmpeg expects
            List<String> lines = chunkPaths.stream()
                .map(path -> "file '" + path.toString().replace("\\", "/") + "'")
                .collect(Collectors.toList());

            Files.write(chunkListFile, lines);

            logger.info("Created chunk list file at: {}", chunkListFile);

            // Build FFmpeg command
            ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", chunkListFile.toString(),
                "-c", "copy",
                outputPath.toString()
            );

            // Execute the process
            Process process = processBuilder.start();
            int exitCode = process.waitFor();

            // Capture standard output and error
            String output = new String(process.getInputStream().readAllBytes());
            String error = new String(process.getErrorStream().readAllBytes());

            if (exitCode == 0) {
                logger.info("FFmpeg merge successful");
                return true;
            } else {
                logger.warn("FFmpeg failed with exit code {}", exitCode);
                logger.warn("FFmpeg output: {}", output);
                logger.warn("FFmpeg error: {}", error);
                return false;
            }
        } catch (InterruptedException e) {
            logger.error("FFmpeg process was interrupted", e);
            Thread.currentThread().interrupt();
            return false;
        } finally {
            // Clean up temporary file
            try {
                Files.deleteIfExists(chunkListFile);
            } catch (IOException e) {
                logger.warn("Could not delete temporary file: {}", chunkListFile);
            }
        }
    }

    /**
     * Merges audio chunks using simple concatenation
     * This method is a fallback when FFmpeg is not available
     * @param chunkPaths List of paths to audio chunks
     * @param outputPath Path where the merged file will be saved
     */
    private void mergeWithSimpleConcatenation(List<Path> chunkPaths, Path outputPath) throws IOException {
        logger.info("Using simple concatenation to merge audio chunks - total chunks: {}", chunkPaths.size());

        try (var outputStream = Files.newOutputStream(outputPath)) {
            // Simply concatenate all chunks in order
            for (Path chunkPath : chunkPaths) {
                if (!Files.exists(chunkPath)) {
                    logger.warn("Chunk file does not exist: {}", chunkPath);
                    continue;
                }
                byte[] chunkData = Files.readAllBytes(chunkPath);
                logger.info("Processing chunk: {}, size: {} bytes", chunkPath.getFileName(), chunkData.length);

                // Write the chunk data directly
                outputStream.write(chunkData);
                logger.info("Wrote chunk data: {}, size: {} bytes", chunkPath, chunkData.length);
            }
        }
        logger.info("Completed simple concatenation of audio chunks to: {}", outputPath);
    }

    private void cleanupChunksFromS3(List<Audio> chunks) {
        for (Audio chunk : chunks) {
            try {
                if (chunk.getS3Url() != null && s3Service != null) {
                    // Extract the S3 key from the URL
                    String s3Key = extractS3KeyFromUrl(chunk.getS3Url());
                    s3Service.deleteFile(s3Key);
                    logger.info("Deleted S3 chunk: " + s3Key);
                }
            } catch (Exception e) {
                logger.error("Failed to delete S3 chunk: " + chunk.getS3Url(), e);
                // Continue with other chunks even if one fails
            }
        }
    }
    
    private String extractS3KeyFromUrl(String s3Url) {
        // Example implementation - adjust based on your S3 URL format
        // For URLs like https://bucket-name.s3.amazonaws.com/audio/123/file.webm
        // Extract the part after the domain: audio/123/file.webm
        int domainEndIndex = s3Url.indexOf(".s3.amazonaws.com/") + ".s3.amazonaws.com/".length();
        if (domainEndIndex > 0) {
            return s3Url.substring(domainEndIndex);
        }
        return s3Url; // Fallback
    }
    
    /**
     * Cleans up audio chunks from the database
     * No longer deletes local files since we're using S3 exclusively
     */
    private void cleanupChunks(List<Audio> chunks) {
        for (Audio chunk : chunks) {
            try {
                // Only delete from database, no local files to clean up
                audioRepository.delete(chunk);
            } catch (Exception e) {
                logger.error("Failed to cleanup chunk from database: {}", chunk.getFilename(), e);
            }
        }
    }
}