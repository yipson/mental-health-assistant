package com.mentalhealth.assistant.controller;

import com.mentalhealth.assistant.dto.JwtResponse;
import com.mentalhealth.assistant.dto.LoginRequest;
import com.mentalhealth.assistant.dto.RegisterRequest;
import com.mentalhealth.assistant.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        boolean isRegistered = authService.registerUser(registerRequest);
        
        if (!isRegistered) {
            // Determine the exact error (username or email conflict)
            // This could be improved by having the service return more specific error information
            return ResponseEntity.badRequest().body("Error: Username or email is already in use!");
        }
        
        return ResponseEntity.ok("User registered successfully!");
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(jwtResponse);
    }
}
