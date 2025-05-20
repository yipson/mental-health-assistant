# Docker Deployment Guide for Mental Health Assistant

This guide explains how to deploy both the frontend and backend components of the Mental Health Assistant application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Git (to clone the repository)

## Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd mental-health-assistant
   ```

2. Environment Variables:
   - A `.env` file has been created in the root directory with your AWS credentials and other configuration
   - **IMPORTANT**: For security reasons, do not commit the `.env` file to your repository
   - Add `.env` to your `.gitignore` file if it's not already there

## Deployment

### Build and Start the Containers

```bash
docker-compose up -d --build
```

This command will:
- Build both the frontend and backend Docker images
- Start the containers in detached mode

### Check Container Status

```bash
docker-compose ps
```

### View Logs

```bash
# View logs from all containers
docker-compose logs

# View logs from a specific container
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Stop the Containers

```bash
docker-compose down
```

## Accessing the Application

- Frontend: http://localhost
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

## Container Information

### Backend Container

- Base image: Eclipse Temurin (Java 17)
- Exposed port: 8080
- Volume: Persistent storage for uploaded audio files
- Environment variables: AWS credentials and other configurations are passed from the `.env` file

### Frontend Container

- Base image: Node.js for building, Nginx for serving
- Exposed port: 80
- Configured to proxy API requests to the backend

## Troubleshooting

1. If containers fail to start, check the logs:
   ```bash
   docker-compose logs
   ```

2. If you need to rebuild after making changes:
   ```bash
   docker-compose up -d --build
   ```

3. If you need to remove all containers and volumes:
   ```bash
   docker-compose down -v
   ```

## Security Notes

- The AWS credentials are stored in the `.env` file and passed to the containers as environment variables
- Never commit the `.env` file to your repository
- Consider using a secrets management solution for production deployments
