package com.mentalhealth.assistant.controller;

import com.mentalhealth.assistant.dto.SessionDto;
import com.mentalhealth.assistant.model.SessionStatus;
import com.mentalhealth.assistant.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @GetMapping
    public ResponseEntity<List<SessionDto>> getAllSessions() {
        List<SessionDto> sessions = sessionService.getAllSessions();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionDto> getSessionById(@PathVariable Long id) {
        SessionDto session = sessionService.getSessionById(id);
        return ResponseEntity.ok(session);
    }

    @PostMapping
    public ResponseEntity<SessionDto> createSession(@RequestBody SessionDto sessionDto) {
        SessionDto createdSession = sessionService.createSession(sessionDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSession);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SessionDto> updateSession(@PathVariable Long id, @RequestBody SessionDto sessionDto) {
        SessionDto updatedSession = sessionService.updateSession(id, sessionDto);
        return ResponseEntity.ok(updatedSession);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SessionDto>> getSessionsByStatus(@PathVariable SessionStatus status) {
        List<SessionDto> sessions = sessionService.getSessionsByStatus(status);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getSessionStats() {
        Map<String, Long> stats = sessionService.getSessionStats();
        return ResponseEntity.ok(stats);
    }
}
