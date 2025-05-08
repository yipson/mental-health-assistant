package com.mentalhealth.assistant.service;

import com.mentalhealth.assistant.dto.SessionDto;
import com.mentalhealth.assistant.model.Session;
import com.mentalhealth.assistant.model.SessionStatus;
import com.mentalhealth.assistant.model.User;
import com.mentalhealth.assistant.repository.SessionRepository;
import com.mentalhealth.assistant.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SessionService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get the currently authenticated user
     * 
     * @return the authenticated user entity
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
    
    /**
     * Get all sessions for the current authenticated user
     * 
     * @return list of session DTOs
     */
    public List<SessionDto> getAllSessions() {
        User user = getCurrentUser();
        List<Session> sessions = sessionRepository.findByUser(user);
        return sessions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get a session by ID
     * 
     * @param id the session ID
     * @return the session DTO
     */
    public SessionDto getSessionById(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        return convertToDto(session);
    }

    /**
     * Create a new session
     * 
     * @param sessionDto the session data
     * @return the created session DTO
     */
    public SessionDto createSession(SessionDto sessionDto) {
        User user = userRepository.findById(sessionDto.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Session session = new Session();
        session.setPatientName(sessionDto.getPatientName());
        session.setDate(sessionDto.getDate());
        session.setDuration(sessionDto.getDuration());
        session.setStatus(sessionDto.getStatus() != null ? sessionDto.getStatus() : SessionStatus.SCHEDULED);
        session.setNotes(sessionDto.getNotes());
        session.setUser(user);

        Session savedSession = sessionRepository.save(session);
        return convertToDto(savedSession);
    }

    /**
     * Update an existing session
     * 
     * @param id the session ID
     * @param sessionDto the updated session data
     * @return the updated session DTO
     */
    public SessionDto updateSession(Long id, SessionDto sessionDto) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        session.setPatientName(sessionDto.getPatientName());
        session.setDate(sessionDto.getDate());
        session.setDuration(sessionDto.getDuration());
        session.setStatus(sessionDto.getStatus());
        session.setNotes(sessionDto.getNotes());
        session.setRecordingUrl(sessionDto.getRecordingUrl());
        session.setTranscriptionId(sessionDto.getTranscriptionId());
        session.setSummaryId(sessionDto.getSummaryId());

        Session updatedSession = sessionRepository.save(session);
        return convertToDto(updatedSession);
    }

    /**
     * Delete a session
     * 
     * @param id the session ID
     */
    public void deleteSession(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        sessionRepository.delete(session);
    }

    /**
     * Get sessions by status for the current authenticated user
     * 
     * @param status the session status
     * @return list of session DTOs
     */
    public List<SessionDto> getSessionsByStatus(SessionStatus status) {
        User user = getCurrentUser();
        List<Session> sessions = sessionRepository.findByUserAndStatus(user, status);
        return sessions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get session statistics for the current authenticated user
     * 
     * @return map of session statistics
     */
    public Map<String, Long> getSessionStats() {
        User user = getCurrentUser();

        Long totalSessions = sessionRepository.count();
        Long completedSessions = sessionRepository.countByUserAndStatus(user, SessionStatus.COMPLETED);
        Long scheduledSessions = sessionRepository.countByUserAndStatus(user, SessionStatus.SCHEDULED);
        Long inProgressSessions = sessionRepository.countByUserAndStatus(user, SessionStatus.IN_PROGRESS);

        return Map.of(
                "totalSessions", totalSessions,
                "completedSessions", completedSessions,
                "scheduledSessions", scheduledSessions,
                "inProgressSessions", inProgressSessions
        );
    }

    /**
     * Convert a Session entity to a SessionDto
     * 
     * @param session the session entity
     * @return the session DTO
     */
    private SessionDto convertToDto(Session session) {
        SessionDto dto = new SessionDto();
        dto.setId(session.getId());
        dto.setPatientName(session.getPatientName());
        dto.setDate(session.getDate());
        dto.setDuration(session.getDuration());
        dto.setStatus(session.getStatus());
        dto.setNotes(session.getNotes());
        dto.setRecordingUrl(session.getRecordingUrl());
        dto.setTranscriptionId(session.getTranscriptionId());
        dto.setSummaryId(session.getSummaryId());
        dto.setUserId(session.getUser().getId());
        dto.setCreatedAt(session.getCreatedAt());
        dto.setUpdatedAt(session.getUpdatedAt());
        return dto;
    }
}
