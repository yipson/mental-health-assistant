package com.mentalhealth.assistant.config;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración para conexión a Amazon S3
 */
@Configuration
public class S3Config {

    @Value("${aws.access.key}")
    private String accessKey;

    @Value("${aws.secret.key}")
    private String secretKey;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    /**
     * Crea y configura un cliente de Amazon S3
     * @return Cliente configurado de AmazonS3
     */
    @Bean
    public AmazonS3 amazonS3Client() {
        System.out.println("S3CONFIG DEBUG - Initializing S3 client with:");
        System.out.println("S3CONFIG DEBUG - Region: " + region);
        System.out.println("S3CONFIG DEBUG - Bucket: " + bucketName);
        System.out.println("S3CONFIG DEBUG - Access Key ID: " + accessKey.substring(0, 5) + "...");
        System.out.println("S3CONFIG DEBUG - Secret Key: " + (secretKey != null ? "[PROVIDED]" : "[NULL]"));

        try {
            AWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
            
            AmazonS3 client = AmazonS3ClientBuilder
                    .standard()
                    .withCredentials(new AWSStaticCredentialsProvider(credentials))
                    .withRegion(Regions.fromName(region))
                    .build();
            
            System.out.println("S3CONFIG DEBUG - S3 client successfully created");
            
            // Test if we can access the S3 service
            try {
                boolean bucketExists = client.doesBucketExistV2(bucketName);
                System.out.println("S3CONFIG DEBUG - Bucket '" + bucketName + "' exists: " + bucketExists);
                if (!bucketExists) {
                    System.out.println("S3CONFIG WARNING - Bucket '" + bucketName + "' does not exist!");
                }
            } catch (Exception e) {
                System.out.println("S3CONFIG ERROR - Failed to check bucket existence: " + e.getMessage());
            }
            
            return client;
        } catch (Exception e) {
            System.out.println("S3CONFIG ERROR - Failed to create S3 client: " + e.getMessage());
            e.printStackTrace();
            // Return null to indicate failure - this will be caught in the S3Service
            return null;
        }
    }

    /**
     * @return Nombre del bucket S3 configurado
     */
    @Bean
    public String s3BucketName() {
        return bucketName;
    }
}