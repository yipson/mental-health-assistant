import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  Progress,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import {
  FaMicrophone,
  FaStop,
  FaTrash,
  FaPlay,
  FaPause,
  FaBackward,
  FaForward,
} from "react-icons/fa";
import WaveformDisplay from "./WaveformDisplay";
import { transcriptionApi } from "../../api/api";

interface AudioRecorderProps {
  sessionId: string;
  onRecordingComplete?: (recordingUrl: string) => void;
  onTranscriptionComplete?: (transcriptionId: string) => void;
}

type RecordingData = {
  blob: Blob;
  url: string;
  duration: number;
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  sessionId,
  onRecordingComplete,
  onTranscriptionComplete,
}) => {
  const toast = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingData, setRecordingData] = useState<RecordingData | null>(
    null
  );
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    };
  }, [isRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Reset state
      setRecordingTime(0);
      audioChunks.current = [];

      // Request microphone access
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Create media recorder
      mediaRecorder.current = new MediaRecorder(stream.current);

      // Handle data available event
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.current.onstop = () => {
        if (audioChunks.current.length > 0) {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/webm",
          });
          const audioUrl = URL.createObjectURL(audioBlob);

          const newRecordingData = {
            blob: audioBlob,
            url: audioUrl,
            duration: recordingTime,
          };

          setRecordingData(newRecordingData);

          if (onRecordingComplete) {
            onRecordingComplete(audioUrl);
          }
        }

        // Clean up
        if (stream.current) {
          stream.current.getTracks().forEach((track) => track.stop());
          stream.current = null;
        }
      };

      // Start recording
      mediaRecorder.current.start(1000); // Capture in 1-second chunks
      setIsRecording(true);

      toast({
        title: "Recording started",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Failed to start recording",
        description:
          error instanceof Error
            ? error.message
            : "Could not access microphone",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setIsRecording(false);

      toast({
        title: "Recording stopped",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };





  const handleStopRecording = () => {
    setShowStopConfirm(true);
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      toast({
        title: "Recording Error",
        description:
          "Failed to start recording. Please check microphone permissions.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const confirmStopRecording = () => {
    setShowStopConfirm(false);
    stopRecording();
  };

  //TODO: implement transcription in another logic
  /**
  const handleTranscribe = async () => {
    if (!recordingData?.blob) {
      toast({
        title: "No recording available",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsTranscribing(true);
      toast({
        title: "Starting transcription",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      // TODO: Implement transcription logic, search for OpenAI Whisper API or similar
      const response = await transcriptionApi.createTranscription(
        sessionId,
        recordingData.blob
      );

      if (response.success && response.data) {
        if (onTranscriptionComplete) {
          onTranscriptionComplete(response.data.id);
        }

        toast({
          title: "Transcription complete",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.error || "Failed to transcribe");
      }
    } catch (error) {
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTranscribing(false);
    }
  };
  **/

  const handlePlayPause = () => {
    if (!recordingData?.url) return;

    if (!audioPlayer.current) {
      audioPlayer.current = new Audio(recordingData.url);
      audioPlayer.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayer.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayer.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (audioPlayer.current) {
      audioPlayer.current.pause();
      audioPlayer.current = null;
    }
    setIsPlaying(false);

    // Clean up any existing recording
    if (recordingData?.url) {
      URL.revokeObjectURL(recordingData.url);
    }

    setRecordingData(null);
    setRecordingTime(0);

    toast({
      title: "Recording reset",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.pause();
        audioPlayer.current = null;
      }
    };
  }, []);

  const handleForward = () => {
    if (audioPlayer.current) {
      audioPlayer.current.currentTime += 10; // Adelanta 10 segundos
    }
  };

  const handleBackward = () => {
    if (audioPlayer.current) {
      audioPlayer.current.currentTime -= 10; // Retrocede 10 segundos
    }
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
        {/* Sección del Grabador */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="xl" fontWeight="bold">
              Session Recorder






















































            </Text>

            {isRecording && (
              <Badge


















                colorScheme="red"
                fontSize="md"
                px={2}
                py={1}
                borderRadius="full"
                animation="pulse 1.5s infinite"
                sx={{
                  "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                    "100%": { opacity: 1 },
                  },
                }}
              >
                RECORDING
              </Badge>
            )}
          </Flex>

          {/* Audio visualization or waveform */}
          <Box h="60px" bg="gray.50" borderRadius="md" p={2} mb={4}>
            {recordingData && !isRecording ? (
              <WaveformDisplay audioUrl={recordingData.url} />
            ) : (
              <Flex h="100%" align="center" justify="center">
                <Text color="gray.400" fontSize="sm">
                  {isRecording
                    ? "Recording in progress..."
                    : "Audio visualization will appear here"}
                </Text>
              </Flex>
            )}
          </Box>

          {/* Timer display */}
          <Flex
            justify="center"
            align="center"
            h="50px"
            bg={isRecording ? "red.50" : "gray.50"}
            borderRadius="md"
            mb={4}
          >
            {isRecording ? (
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color="red.500"
                fontFamily="mono"
              >
                {formatTime(recordingTime)}
              </Text>
            ) : recordingData ? (
              <Text fontSize="md" color="green.500" fontWeight="semibold">
                Recording complete - {formatTime(recordingData.duration)}
              </Text>
            ) : (
              <Text fontSize="md" color="gray.500">
                Ready to record
              </Text>
            )}
          </Flex>
        </Box>

        {/* Sección de Controles */}
        <Box 
          borderTop="2px" 
          borderColor="gray.200" 
          pt={4}
        >
          {/* Recording controls */}
          <HStack spacing={4} justify="center" mb={4}>
            {!isRecording && !recordingData && (
              <Tooltip label="Start Record">
                <Button
                  leftIcon={<FaMicrophone />}
                  colorScheme="red"
                  onClick={handleStartRecording}
                  size="lg"
                >
                  Start Record
                </Button>
              </Tooltip>
            )}

            {isRecording && (
              <Tooltip label="Stop Record">
                <Button
                  leftIcon={<FaStop />}
                  colorScheme="gray"
                  onClick={handleStopRecording}
                >
                  Stop Record
                </Button>
              </Tooltip>
            )}
          </HStack>

          {/* Playback controls */}
          {recordingData && !isRecording && (
            <HStack spacing={4} justify="center">
              <Tooltip label="Backward 10 seconds">
                <Button
                  leftIcon={<FaBackward />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleBackward}
                >
                  -10s
                </Button>
              </Tooltip>

              <Tooltip label={isPlaying ? "Pause" : "Play"}>
                <Button
                  leftIcon={isPlaying ? <FaPause /> : <FaPlay />}
                  colorScheme="blue"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              </Tooltip>

              <Tooltip label="Foward 10 seconds">
                <Button
                  leftIcon={<FaForward />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleForward}
                >
                  +10s
                </Button>
              </Tooltip>

              <Tooltip label="Reset record">
                <Button
                  leftIcon={<FaTrash />}
                  colorScheme="red"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Tooltip>
            </HStack>
          )}
        </Box>

        {isTranscribing && (
          <Box>
            <Text mb={2}>Translating audio...</Text>
            <Progress size="sm" isIndeterminate colorScheme="brand" />
          </Box>
        )}
      </VStack>

      {/* Confirmation dialog for stopping recording */}
      <AlertDialog
        isOpen={showStopConfirm}
        leastDestructiveRef={cancelRef}
        onClose={() => setShowStopConfirm(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Stop Recording
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to stop recording? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setShowStopConfirm(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmStopRecording} ml={3}>
                Stop Recording
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AudioRecorder;