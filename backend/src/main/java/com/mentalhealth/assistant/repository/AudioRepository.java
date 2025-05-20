package com.mentalhealth.assistant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mentalhealth.assistant.model.Audio;

public interface AudioRepository extends JpaRepository<Audio, Long> {
    List<Audio> findBySessionIdOrderByChunkIndex(Long sessionId);

    /**
     * Find audio files by session ID and chunk index
     * @param sessionId The session ID
     * @param chunkIndex The chunk index
     * @return List of audio files matching the criteria
     */
    List<Audio> findBySessionIdAndChunkIndex(Long sessionId, Integer chunkIndex);
}