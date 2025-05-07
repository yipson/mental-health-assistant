import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Flex,
  Button,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Icon
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import useSessionStore from '../store/sessionStore';
import { sessionsApi } from '../api/api';
import { Session } from '../types';
import SessionList from '../components/session/SessionList';
import SessionForm from '../components/session/SessionForm';

const Sessions: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { sessions, setSessions, setLoading, isLoading, setCurrentSession } = useSessionStore();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

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

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    onOpen();
  };

  const handleNewSession = () => {
    setSelectedSession(null);
    onOpen();
  };

  const handleSessionSuccess = (session: Session) => {
    onClose();
    toast({
      title: selectedSession ? 'Session updated' : 'Session created',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Sessions</Heading>
        <Button
          colorScheme="brand"
          onClick={handleNewSession}
        >
          + New Session
        </Button>
      </Flex>

      <Box bg="white" p={4} borderRadius="lg" shadow="md">
        <Tabs colorScheme="brand" variant="enclosed">
          <TabList>
            <Tab>All Sessions</Tab>
            <Tab>Upcoming</Tab>
            <Tab>Completed</Tab>
            <Tab>In Progress</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} pt={4}>
              <SessionList 
                onViewSession={handleViewSession} 
                onEditSession={handleEditSession} 
              />
            </TabPanel>
            <TabPanel px={0} pt={4}>
              <SessionList 
                onViewSession={handleViewSession} 
                onEditSession={handleEditSession} 
              />
            </TabPanel>
            <TabPanel px={0} pt={4}>
              <SessionList 
                onViewSession={handleViewSession} 
                onEditSession={handleEditSession} 
              />
            </TabPanel>
            <TabPanel px={0} pt={4}>
              <SessionList 
                onViewSession={handleViewSession} 
                onEditSession={handleEditSession} 
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* New/Edit Session Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedSession ? 'Edit Session' : 'New Session'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SessionForm
              initialData={selectedSession || {}}
              onSuccess={handleSessionSuccess}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sessions;
