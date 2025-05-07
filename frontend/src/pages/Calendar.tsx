import React, { useEffect } from 'react';
import {
  Box,
  Heading,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import useSessionStore from '../store/sessionStore';
import { sessionsApi } from '../api/api';
import { Session } from '../types';
import SessionCalendar from '../components/calendar/SessionCalendar';

const Calendar: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { 
    sessions, 
    setSessions, 
    setLoading, 
    isLoading,
    setCurrentSession 
  } = useSessionStore();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await sessionsApi.getAllSessions();
        
        if (response.success && response.data) {
          setSessions(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch sessions');
        }
      } catch (error) {
        toast({
          title: 'Error fetching sessions',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [setSessions, setLoading, toast]);

  const handleViewSession = (session: Session) => {
    setCurrentSession(session);
    navigate(`/sessions/${session.id}`);
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>Calendar</Heading>
      <SessionCalendar onViewSession={handleViewSession} />
    </Box>
  );
};

export default Calendar;
