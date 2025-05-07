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
- Node.js with Express
- MongoDB for database
- Socket.IO for real-time communication
- AI integration for transcription and summarization

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mental-health-assistant.git
   cd mental-health-assistant
   ```

2. Install dependencies for frontend
   ```bash
   cd frontend
   npm install
   ```

3. Install dependencies for backend
   ```bash
   cd ../backend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mental-health-assistant
   JWT_SECRET=your_jwt_secret
   AI_API_KEY=your_ai_api_key
   ```

5. Start the development servers

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm start
   ```

6. Open your browser and navigate to `http://localhost:3000`

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
