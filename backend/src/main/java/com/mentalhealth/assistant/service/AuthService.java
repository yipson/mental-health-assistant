package com.mentalhealth.assistant.service;

import com.mentalhealth.assistant.dto.JwtResponse;
import com.mentalhealth.assistant.dto.LoginRequest;
import com.mentalhealth.assistant.dto.RegisterRequest;
import com.mentalhealth.assistant.model.User;
import com.mentalhealth.assistant.repository.UserRepository;
import com.mentalhealth.assistant.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    /**
     * Register a new user
     * 
     * @param registerRequest the registration details
     * @return true if registration was successful, false otherwise
     */
    public boolean registerUser(RegisterRequest registerRequest) {
        // Check if username is already taken
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return false;
        }
        
        // Check if email is already in use
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return false;
        }
        
        // Create new user's account
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        
        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        user.setRoles(roles);
        
        userRepository.save(user);
        
        return true;
    }
    
    /**
     * Authenticate a user and generate a JWT token
     * 
     * @param loginRequest the login credentials
     * @return JwtResponse containing the token and user details
     */
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
            .map(item -> item.getAuthority())
            .collect(Collectors.toList());
        
        User user = userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("Error: User not found."));
        
        return new JwtResponse(
            jwt,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            roles
        );
    }
}
