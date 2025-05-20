FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /workspace/app

# Copy gradle files
COPY gradle gradle
COPY gradlew .
COPY gradlew.bat .
COPY build.gradle .
COPY settings.gradle .

# Make gradlew executable
RUN chmod +x gradlew

# Copy source code
COPY src src

# Build the application
RUN ./gradlew build -x test

# Production stage
FROM eclipse-temurin:17-jre-alpine
VOLUME /tmp

# Copy the built JAR file
COPY --from=build /workspace/app/build/libs/*.jar /app/app.jar

# Create directory for audio uploads
RUN mkdir -p /app/uploads/audio

# Environment variables for AWS credentials (these will be provided at runtime)
ENV AWS_ACCESS_KEY=""
ENV AWS_SECRET_KEY=""
ENV AWS_S3_REGION="us-east-1"
ENV AWS_S3_BUCKET="mental-health-app-audio-bucket"

ENTRYPOINT ["java","-jar","/app/app.jar"]
