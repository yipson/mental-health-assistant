import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  Progress,
  useToast,
  Icon
} from '@chakra-ui/react';
import { FaMicrophone, FaStop, FaTrash, FaSave } from 'react-icons/fa';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import useRecordingStore from '../../store/recordingStore';
import WaveformDisplay from './WaveformDisplay';
import { transcriptionApi } from '../../api/api';

interface AudioRecorderProps {
  sessionId: string;
  onRecordingComplete?: (recordingUrl: string) => void;
  onTranscriptionComplete?: (transcriptionId: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  sessionId,
  onRecordingComplete,
  onTranscriptionComplete
}) => {
  const toast = useToast();
  const [recordingTime, setRecordingTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  
  const {
    recordingData,
    isTranscribing,
    startTranscribing,
    stopTranscribing,
    setTranscriptionText,
    resetAll
  } = useRecordingStore();
  
  const {
    isRecording,
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl
  } = useAudioRecorder({
    onRecordingComplete: (blob, url) => {
      if (onRecordingComplete) {
        onRecordingComplete(url);
      }
    }
  });

  useEffect(() => {
    if (isRecording) {
      const intervalId = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimer(intervalId);
    } else if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRecording, timer]);

  const handleStartRecording = () => {
    setRecordingTime(0);
    startRecording();
    toast({
      title: 'Recording started',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleStopRecording = () => {
    stopRecording();
    toast({
      title: 'Recording stopped',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleTranscribe = async () => {
    if (!recordingData?.blob) {
      toast({
        title: 'No recording available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      startTranscribing();
      toast({
        title: 'Starting transcription',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      const response = await transcriptionApi.createTranscription(
        sessionId,
        recordingData.blob
      );

      if (response.success && response.data) {
        setTranscriptionText(response.data.text);
        
        if (onTranscriptionComplete) {
          onTranscriptionComplete(response.data.id);
        }
        
        toast({
          title: 'Transcription complete',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.error || 'Failed to transcribe');
      }
    } catch (error) {
      toast({
        title: 'Transcription failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      stopTranscribing();
    }
  };

  const handleReset = () => {
    resetAll();
    setRecordingTime(0);
    toast({
      title: 'Recording reset',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      bg="white"
      shadow="md"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">
          Session Recorder
        </Text>
        
        {mediaBlobUrl && !isRecording && (
          <WaveformDisplay audioUrl={mediaBlobUrl} />
        )}
        
        <Flex justify="center" align="center" h="50px">
          {isRecording ? (
            <Text fontSize="xl" color="red.500">
              Recording... {formatTime(recordingTime)}
            </Text>
          ) : recordingData ? (
            <Text fontSize="md" color="green.500">
              Recording complete - {formatTime(recordingTime)}
            </Text>
          ) : (
            <Text fontSize="md" color="gray.500">
              Ready to record
            </Text>
          )}
        </Flex>
        
        {isTranscribing && (
          <Box>
            <Text mb={2}>Transcribing audio...</Text>
            <Progress size="sm" isIndeterminate colorScheme="brand" />
          </Box>
        )}
        
        <HStack spacing={4} justify="center">
          {!isRecording && !recordingData && (
            <Button
              leftIcon={<FaMicrophone />}
              colorScheme="red"
              onClick={handleStartRecording}
            >
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <Button
              leftIcon={<FaStop />}
              colorScheme="gray"
              onClick={handleStopRecording}
            >
              Stop Recording
            </Button>
          )}
          
          {recordingData && !isRecording && (
            <>
              <Button
                leftIcon={<FaSave />}
                colorScheme="brand"
                onClick={handleTranscribe}
                isLoading={isTranscribing}
                loadingText="Transcribing"
              >
                Transcribe
              </Button>
              
              <Button
                leftIcon={<FaTrash />}
                colorScheme="red"
                variant="outline"
                onClick={handleReset}
              >
                Reset
              </Button>
            </>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default AudioRecorder;
