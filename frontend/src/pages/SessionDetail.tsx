import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Flex,
  Button,
  Spinner,
  Center,
  useToast,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Icon
} from '@chakra-ui/react';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useSessionStore from '../store/sessionStore';
import { sessionsApi } from '../api/api';
import { Session } from '../types';
import SessionRecorder from '../components/session/SessionRecorder';

const SessionDetail: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { 
    currentSession, 
    setCurrentSession, 
    sessions,
    setLoading,
    isLoading
  } = useSessionStore();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      // Check if we already have the session in the store
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession) {
        setSession(existingSession);
        setCurrentSession(existingSession);
        return;
      }

      try {
        setLoading(true);
        const response = await sessionsApi.getSessionById(sessionId);
        
        if (response.success && response.data) {
          setSession(response.data);
          setCurrentSession(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch session');
        }
      } catch (error) {
        toast({
          title: 'Error fetching session',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, sessions, setCurrentSession, setLoading, toast, navigate]);

  const handleEditSession = () => {
    navigate(`/sessions/edit/${sessionId}`);
  };

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  // Add explicit null check with type assertion
  if (!session) {
    return <Box>Session not found</Box>;
  }
  
  // Explicitly type the session to avoid complex union type
  const typedSession: Session = session;

  return (
    <Box>
      <Breadcrumb separator=">" mb={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/sessions">Sessions</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>{typedSession.patientName}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center">
          <Button
            as={Link}
            to="/sessions"
            variant="ghost"
            mr={4}
          >
            ← Back
          </Button>
          <Heading size="lg">{typedSession.patientName}'s Session</Heading>
        </Flex>
        <Button
          colorScheme="brand"
          variant="outline"
          onClick={handleEditSession}
        >
          ✏️ Edit
        </Button>
      </Flex>

      <SessionRecorder session={typedSession} />
    </Box>
  );
};

export default SessionDetail;
