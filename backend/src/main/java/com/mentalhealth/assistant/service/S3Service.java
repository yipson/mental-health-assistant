package com.mentalhealth.assistant.service;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Servicio para manejar la subida de archivos a S3
 * Esta implementación puede funcionar tanto con AWS S3 real como en modo simulado
 */
@Service
public class S3Service {
    
    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);
    
    @Autowired
    private AmazonS3 amazonS3;
    
    @Autowired
    private String s3BucketName;
    
    /**
     * Sube un archivo a S3
     * @param filePath Ruta local del archivo a subir
     * @param key Clave (nombre) del archivo en S3
     * @return URL del archivo en S3
     */
    public String uploadFile(Path filePath, String key) {
        try {
            logger.info("Uploading file to S3: {}", key);
            
            // Verificar que el archivo existe
            if (!Files.exists(filePath)) {
                throw new IOException("File not found: " + filePath);
            }
            
            // Obtener contenido e información del archivo
            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = determineContentType(filePath.toString());
            
            // Verificar si el cliente S3 está disponible
            if (amazonS3 == null) {
                logger.info("S3 client not available. Simulating upload for: {}", key);
                logger.info("File details - Size: {} bytes, Type: {}", fileContent.length, contentType);
                
                // Generar una URL simulada para desarrollo local
                return String.format("https://%s.s3.amazonaws.com/%s", s3BucketName, key);
            }
            
            // Crear metadatos para el objeto
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(fileContent.length);
            metadata.setContentType(contentType);
            
            // Crear la solicitud de subida
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    s3BucketName,
                    key,
                    new ByteArrayInputStream(fileContent),
                    metadata
            );
            
            // Subir el archivo a S3
            amazonS3.putObject(putObjectRequest);
            logger.info("File successfully uploaded to S3: {}", key);
            
            // Obtener y devolver la URL del archivo en S3
            return amazonS3.getUrl(s3BucketName, key).toString();
            
        } catch (IOException e) {
            logger.error("Error reading file for S3 upload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to read file for S3 upload: " + e.getMessage(), e);
        } catch (AmazonServiceException e) {
            logger.error("Error uploading file to S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }
    
    /**
     * Determina el tipo de contenido basado en la extensión del archivo
     * @param filename Nombre del archivo
     * @return Tipo de contenido MIME
     */
    private String determineContentType(String filename) {
        if (filename.endsWith(".webm")) {
            return "audio/webm";
        } else if (filename.endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (filename.endsWith(".wav")) {
            return "audio/wav";
        } else if (filename.endsWith(".ogg")) {
            return "audio/ogg";
        } else {
            return "application/octet-stream";
        }
    }
}
