package com.mentalhealth.assistant.repository;

import com.mentalhealth.assistant.model.Session;
import com.mentalhealth.assistant.model.SessionStatus;
import com.mentalhealth.assistant.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByUser(User user);
    List<Session> findByUserAndStatus(User user, SessionStatus status);
    List<Session> findByUserAndDateBetween(User user, LocalDateTime start, LocalDateTime end);
    List<Session> findByPatientNameContainingIgnoreCase(String patientName);
    Long countByUserAndStatus(User user, SessionStatus status);
}