package com.mentalhealth.assistant.service;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

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

            System.out.println("Uploading file to S3: " + filePath);
            
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
    
    /**
     * Deletes a file from S3
     * @param key The key (path) of the file in S3
     */
    public void deleteFile(String key) {
        try {
            logger.info("Deleting file from S3: {}", key);
            
            // Check if S3 client is available
            if (amazonS3 == null) {
                logger.info("S3 client not available. Simulating deletion for: {}", key);
                return;
            }
            
            // Delete the object from S3
            amazonS3.deleteObject(s3BucketName, key);
            logger.info("File successfully deleted from S3: {}", key);
            
        } catch (AmazonServiceException e) {
            logger.error("Error deleting file from S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete file from S3: " + e.getMessage(), e);
        }
    }
    
    /**
     * Downloads a file from S3 to a local path
     * @param s3Url The S3 URL of the file to download
     * @param localPath The local path where the file should be saved
     * @return The local path where the file was saved
     */
    public Path downloadFile(String s3Url, Path localPath) {
        try {
            logger.info("Downloading file from S3: {} to {}", s3Url, localPath);
            
            // Check if S3 client is available
            if (amazonS3 == null) {
                logger.info("S3 client not available. Simulating download for: {}", s3Url);
                return localPath;
            }
            
            // Extract the key from the S3 URL
            String key = extractKeyFromS3Url(s3Url);
            
            // Create parent directories if they don't exist
            Files.createDirectories(localPath.getParent());
            
            // Download the object from S3
            S3Object s3Object = amazonS3.getObject(s3BucketName, key);
            try (S3ObjectInputStream inputStream = s3Object.getObjectContent()) {
                Files.copy(inputStream, localPath, StandardCopyOption.REPLACE_EXISTING);
            }
            
            logger.info("File successfully downloaded from S3: {}", localPath);
            return localPath;
            
        } catch (AmazonServiceException e) {
            logger.error("Error downloading file from S3: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to download file from S3: " + e.getMessage(), e);
        } catch (IOException e) {
            logger.error("Error saving downloaded file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save downloaded file: " + e.getMessage(), e);
        }
    }
    
    /**
     * Extracts the S3 key from an S3 URL
     * @param s3Url The S3 URL
     * @return The S3 key
     */


    private String extractKeyFromS3Url(String s3Url) {
        // Handle different S3 URL formats
        if (s3Url.contains(s3BucketName + ".s3.amazonaws.com/")) {
            // Format: https://bucket-name.s3.amazonaws.com/key
            return s3Url.substring(s3Url.indexOf(s3BucketName + ".s3.amazonaws.com/") 
                    + (s3BucketName + ".s3.amazonaws.com/").length());
        } else if (s3Url.contains("s3.amazonaws.com/" + s3BucketName + "/")) {
            // Format: https://s3.amazonaws.com/bucket-name/key
            return s3Url.substring(s3Url.indexOf("s3.amazonaws.com/" + s3BucketName + "/") 
                    + ("s3.amazonaws.com/" + s3BucketName + "/").length());
        } else if (s3Url.startsWith("s3://")) {
            // Format: s3://bucket-name/key
            return s3Url.substring(("s3://" + s3BucketName + "/").length());
        }
        
        // If we can't parse the URL, just return it as is
        logger.warn("Could not parse S3 URL: {}", s3Url);
        return s3Url;
    }
    
    /**
     * Gets the S3 bucket name
     * @return The S3 bucket name
     */
    public String getBucketName() {
        return s3BucketName;
    }
    
    /**
     * Uploads a file to S3 directly from a byte array without requiring local file storage
     * @param fileContent The content of the file as a byte array
     * @param key The key (path) of the file in S3
     * @param contentType The content type of the file
     * @return The URL of the file in S3
     */
    public String uploadFileFromBytes(byte[] fileContent, String key, String contentType) {
        try {
            logger.info("Uploading file directly to S3 from bytes: {}, size: {} bytes", key, fileContent.length);
            System.out.println("S3 UPLOAD DEBUG - Uploading to bucket: " + s3BucketName + ", key: " + key + ", size: " + fileContent.length + " bytes");
            
            // Verify if S3 client is available
            if (amazonS3 == null) {
                logger.error("S3 client is NULL! AWS configuration might be incorrect.");
                System.out.println("S3 UPLOAD ERROR - S3 client is NULL! Check AWS configuration.");
                // Generate a simulated URL for development
                return String.format("https://%s.s3.amazonaws.com/%s", s3BucketName, key);
            }
            
            // Print bucket name for debugging
            System.out.println("S3 UPLOAD DEBUG - Using bucket: " + s3BucketName);
            
            try {
                // Check if bucket exists
                boolean bucketExists = amazonS3.doesBucketExistV2(s3BucketName);
                System.out.println("S3 UPLOAD DEBUG - Bucket exists: " + bucketExists);
                if (!bucketExists) {
                    logger.error("S3 bucket does not exist: {}", s3BucketName);
                    System.out.println("S3 UPLOAD ERROR - Bucket does not exist: " + s3BucketName);
                    throw new RuntimeException("S3 bucket does not exist: " + s3BucketName);
                }
            } catch (Exception e) {
                logger.error("Error checking bucket existence: {}", e.getMessage());
                System.out.println("S3 UPLOAD ERROR - Error checking bucket: " + e.getMessage());
            }
            
            // Create metadata for the object
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(fileContent.length);
            metadata.setContentType(contentType);
            
            // Create upload request
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    s3BucketName,
                    key,
                    new ByteArrayInputStream(fileContent),
                    metadata
            );
            
            // Upload the file to S3
            System.out.println("S3 UPLOAD DEBUG - Executing putObject request...");
            amazonS3.putObject(putObjectRequest);
            System.out.println("S3 UPLOAD DEBUG - putObject request completed successfully!");
            logger.info("File successfully uploaded to S3: {}", key);
            
            // Get and return the S3 URL
            String url = amazonS3.getUrl(s3BucketName, key).toString();
            System.out.println("S3 UPLOAD DEBUG - Generated URL: " + url);
            return url;
            
        } catch (AmazonServiceException e) {
            logger.error("AWS S3 Error: {} - Error Code: {}, AWS Error Type: {}, Request ID: {}", 
                    e.getMessage(), e.getErrorCode(), e.getErrorType(), e.getRequestId());
            System.out.println("S3 UPLOAD ERROR - AWS Error: " + e.getMessage() + ", Code: " + e.getErrorCode() + ", Type: " + e.getErrorType());
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error uploading to S3: {}", e.getMessage(), e);
            System.out.println("S3 UPLOAD ERROR - Unexpected error: " + e.getMessage());
            throw new RuntimeException("Unexpected error uploading to S3: " + e.getMessage(), e);
        }
    }
}