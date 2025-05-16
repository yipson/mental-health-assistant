package com.mentalhealth.assistant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mentalhealth.assistant.model.Audio;

public interface AudioRepository extends JpaRepository<Audio, Long> {
    List<Audio> findBySessionIdOrderByChunkIndex(Long sessionId);
}