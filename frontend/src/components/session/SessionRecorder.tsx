import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Badge,
  useToast
} from '@chakra-ui/react';
import AudioRecorder from '../recorder/AudioRecorder';
import TranscriptionDisplay from '../transcription/TranscriptionDisplay';
import SummaryDisplay from '../ai-summary/SummaryDisplay';
import { summaryApi } from '../../api/api';
import useRecordingStore from '../../store/recordingStore';
import useSessionStore from '../../store/sessionStore';
import { Session, SessionStatus } from '../../types';

interface SessionRecorderProps {
  session: Session;
}

const SessionRecorder: React.FC<SessionRecorderProps> = ({ session }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const { updateSession } = useSessionStore();
  const { 
    startSummarizing, 
    stopSummarizing, 
    setSummary 
  } = useRecordingStore();

  const handleRecordingComplete = (recordingUrl: string) => {
    updateSession(session.id, { 
      recordingUrl,
      status: SessionStatus.IN_PROGRESS 
    });
    
    // Move to transcription tab
    setActiveTab(1);
  };

  const handleTranscriptionComplete = (transcriptionId: string) => {
    updateSession(session.id, { 
      transcriptionId,
      status: SessionStatus.IN_PROGRESS 
    });
  };

  const handleRequestSummary = async () => {
    if (!session.transcriptionId) {
      toast({
        title: 'No transcription available',
        description: 'Please transcribe the session first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      startSummarizing();
      
      const response = await summaryApi.createSummary(session.transcriptionId);
      
      if (response.success && response.data) {
        setSummary(response.data.text);
        
        updateSession(session.id, { 
          summaryId: response.data.id,
          status: SessionStatus.COMPLETED
        });
        
        // Move to summary tab
        setActiveTab(2);
        
        toast({
          title: 'Summary generated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (error) {
      toast({
        title: 'Summary generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      stopSummarizing();
    }
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'scheduled':
        return <Badge colorScheme="blue">Scheduled</Badge>;
      case 'in-progress':
        return <Badge colorScheme="orange">In Progress</Badge>;
      case 'completed':
        return <Badge colorScheme="green">Completed</Badge>;
      case 'cancelled':
        return <Badge colorScheme="red">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <HStack spacing={3}>
            <Heading size="lg">{session.patientName}'s Session</Heading>
            {getStatusBadge()}
          </HStack>
          <Text color="gray.600" mt={1}>
            {new Date(session.date).toLocaleString()} • {session.duration} minutes
          </Text>
        </Box>

        <Tabs 
          colorScheme="brand" 
          index={activeTab} 
          onChange={setActiveTab}
          variant="enclosed"
        >
          <TabList>
            <Tab>Record</Tab>
            <Tab>Transcription</Tab>
            <Tab>AI Summary</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={4}>
              <AudioRecorder 
                sessionId={session.id} 
                onRecordingComplete={handleRecordingComplete}
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            </TabPanel>
            
            <TabPanel p={4}>
              <TranscriptionDisplay 
                sessionId={session.id}
                onRequestSummary={handleRequestSummary}
              />
            </TabPanel>
            
            <TabPanel p={4}>
              <SummaryDisplay sessionId={session.id} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default SessionRecorder;
