# Mental Health Assistant

A modern web application designed to assist mental health professionals in managing therapy sessions, recording conversations, generating transcriptions, and providing AI-powered summaries and insights.

## 🌟 Features

- **Session Management**: Create, schedule, and track therapy sessions
- **Audio Recording**: Record therapy sessions with a built-in audio recorder
- **Transcription**: Automatically transcribe recorded sessions
- **AI Summary**: Generate AI-powered summaries with key points from sessions
- **Dashboard**: View analytics and session statistics
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- React 19
- TypeScript
- Chakra UI v2 for component library
- React Router for navigation
- Zustand for state management
- React Query for data fetching
- Tailwind CSS for styling

### Backend (API)
- Spring Boot (Java 17)
- JPA for ORM
- Spring Security with JWT
- AWS S3 for audio storage
- RESTful API architecture

## 🐳 Docker Deployment

### Prerequisites
- Docker installed on your system
- Docker Compose installed on your system

### Setup and Deployment

1. Clone the repository
   ```bash
   git clone https://github.com/yipson/mental-health-assistant.git
   cd mental-health-assistant
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   AWS_ACCESS_KEY=your_aws_access_key
   AWS_SECRET_KEY=your_aws_secret_key
   AWS_S3_REGION=your_aws_region
   AWS_S3_BUCKET=your_aws_bucket_name
   SPRING_PROFILES_ACTIVE=prod
   ```

3. Build and start the containers
   ```bash
   docker-compose up -d --build
   ```

4. Access the application
   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger-ui.html

### Managing Docker Containers

- View container status: `docker-compose ps`
- View logs: `docker-compose logs` or `docker-compose logs -f` for following logs
- Stop containers: `docker-compose down`

## 🚀 Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- JDK 17
- Gradle

### Frontend Installation

1. Install dependencies for frontend
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server
   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Backend Installation

1. Configure AWS credentials in `backend/src/main/resources/application.properties`

2. Start the Spring Boot application
   ```bash
   cd backend
   ./gradlew bootRun
   ```

3. The backend API will be available at `http://localhost:8080`

## 📱 Application Structure

- **Dashboard**: Overview of sessions, statistics, and quick actions
- **Sessions**: Create and manage therapy sessions
- **Recording**: Record audio during sessions
- **Transcription**: View and edit transcribed text
- **AI Summary**: Review AI-generated summaries and key points

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [React Icons](https://react-icons.github.io/react-icons/) for the icon set
- [Chakra UI](https://chakra-ui.com/) for the component library
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [React Query](https://tanstack.com/query/latest) for data fetching
