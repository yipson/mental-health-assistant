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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import {
  FaMicrophone,
  FaStop,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { audioApi } from "../../api/api";

interface AudioRecorderProps {
  sessionId: string;
  onRecordingComplete?: (recordingUrl: string) => void;
  onTranscriptionComplete?: (transcriptionId: string) => void;
}

interface RecordingData {
  blob: Blob;
  duration: number;
  type?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  sessionId,
  onRecordingComplete,
}) => {
  const toast = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for tracking recording state and preventing duplicate uploads
  const finalChunkUploadedRef = useRef(false); // Tracks if the final chunk has been uploaded
  const lastChunkProcessedTime = useRef(0); // Timestamp of the last processed chunk
  const isChunkUploadInProgress = useRef(false); // Flag to prevent parallel uploads
  const uploadedChunksRef = useRef<Set<number>>(new Set()); // Set of chunk indexes that have been uploaded
  
  // Refs for audio recording
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [currentChunkDuration, setCurrentChunkDuration] = useState(0);
  const CHUNK_DURATION = 5; // 5 seconds for testing, use 5*60 for production
  const chunkInterval = useRef<NodeJS.Timeout | null>(null);
  const currentChunkIndexRef = useRef(0);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      // Set up timer for overall recording time
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Set up separate timer for chunk duration
      chunkInterval.current = setInterval(() => {
        setCurrentChunkDuration(prev => {
          const newDuration = prev + 1;
          console.log(`Chunk duration: ${newDuration}s`);
          
          // If we've reached the chunk duration limit, process the chunk
          if (newDuration >= CHUNK_DURATION) {
            // Use setTimeout to avoid state update conflicts
            setTimeout(() => handleChunkComplete(), 0);
            return 0;
          }
          return newDuration;
        });
      }, 1000);
    } else {
      // Clear both timers when not recording
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      if (chunkInterval.current) {
        clearInterval(chunkInterval.current);
        chunkInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (chunkInterval.current) clearInterval(chunkInterval.current);
    };
  }, [isRecording]);

  // Esta sección ahora está vacía ya que lastChunkProcessedTime se definió arriba con las otras refs

  const handleChunkComplete = async () => {
    // Prevent duplicate processing by checking time since last processing
    // We enforce a minimum gap of 2 seconds between chunk processing
    const now = Date.now();
    if (now - lastChunkProcessedTime.current < 2000) {
      console.log('Skipping duplicate chunk processing, too soon after last one');
      return;
    }
    
    // Check if we're already uploading a chunk
    if (isChunkUploadInProgress.current) {
      console.log('Upload already in progress, skipping');
      return;
    }

    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      try {
        // Set flag to indicate upload in progress
        isChunkUploadInProgress.current = true;
        
        // Request data from the media recorder
        mediaRecorder.current.requestData();
        
        // Wait a short time for the ondataavailable event to fire and add to audioChunks
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create a blob from all chunks collected so far
        if (audioChunks.current.length > 0) {
          const chunkBlob = new Blob(audioChunks.current, { type: "audio/webm" });
          
          // Get the current chunk index from ref
          const chunkIndexToSend = currentChunkIndexRef.current;
          
          // Check if we already uploaded this chunk index
          if (uploadedChunksRef.current.has(chunkIndexToSend)) {
            console.log(`Chunk with index ${chunkIndexToSend} already uploaded, skipping`);
            isChunkUploadInProgress.current = false;
            return;
          }
          
          console.log(`Uploading chunk with index: ${chunkIndexToSend}, size: ${chunkBlob.size} bytes`);
          
          // Only upload if we're not in the process of stopping the recording
          // This prevents double uploads during the stop recording process
          if (isRecording) {
            // Mark this time as when we processed a chunk
            lastChunkProcessedTime.current = now;
            
            await handleAudioUpload(chunkBlob, currentChunkDuration, chunkIndexToSend);
            
            // Mark this chunk as uploaded
            uploadedChunksRef.current.add(chunkIndexToSend);
            
            // Reset the chunks array after uploading
            audioChunks.current = [];
            
            // Increment the chunk index for the next chunk - use ref for immediate update
            currentChunkIndexRef.current = chunkIndexToSend + 1;
          }
        }
      } finally {
        // Clear the upload in progress flag
        isChunkUploadInProgress.current = false;
      }
    }
    
    // Reset the chunk duration timer
    setCurrentChunkDuration(0);
  };

  const startRecording = async () => {
    try {
      // Reset state
      setRecordingTime(0);
      setCurrentChunkDuration(0);
      currentChunkIndexRef.current = 0;
      audioChunks.current = [];
      lastChunkProcessedTime.current = 0;
      isChunkUploadInProgress.current = false;
      finalChunkUploadedRef.current = false;
      uploadedChunksRef.current.clear(); // Clear the set of uploaded chunks

      // Request microphone access
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Create media recorder with more widely supported format
      let selectedMimeType = '';
      
      // Check for MP3 support first (most compatible)
      if (MediaRecorder.isTypeSupported('audio/mp3')) {
        selectedMimeType = 'audio/mp3';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        selectedMimeType = 'audio/mpeg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        selectedMimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMimeType = 'audio/webm';
      } else {
        // Fall back to browser default
        selectedMimeType = '';
      }
      
      console.log("Using MIME type for recording:", selectedMimeType || "browser default");
      
      // Create the media recorder with the supported MIME type
      // Set a timeslice of 5000ms (5 seconds) to match our CHUNK_DURATION
      // This makes the MediaRecorder emit ondataavailable events at regular intervals
      // that match our chunk processing, reducing the chance of duplicates
      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType: selectedMimeType || undefined,
        audioBitsPerSecond: 128000, // Optimize for voice recording
      });

      // Handle data available event
      mediaRecorder.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          console.log("Data available, size: " + event.data.size + ", chunks total: " + audioChunks.current.length);
          
          // We don't process chunks here, we let handleChunkComplete do it
          // This prevents duplicate uploads since we have better control of when chunks are sent
        }
      };

      // Handle recording stop
      mediaRecorder.current.onstop = async () => {
        console.log("Recording stopped");
        
        // Wait a longer time for the ondataavailable event to fire and add to audioChunks
        // This is crucial to ensure all data is collected
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("Audio chunks after stop:", audioChunks.current.length);
        
        if (audioChunks.current.length > 0) {
          // Get the MIME type that was used for recording
          const mimeType = mediaRecorder.current?.mimeType || '';
          console.log("Creating final audio blob with MIME type:", mimeType);
          
          // Try to use a more compatible format for recording
          let blobType = mimeType;
          if (!mimeType || mimeType.includes('webm')) {
            blobType = 'audio/mp3';
          }
          
          console.log("Final blob type for recording:", blobType);
          
          // Create a blob with the appropriate MIME type
          const audioBlob = new Blob(audioChunks.current, {
            type: blobType,
          });
          
          // Save recording data without URL for playback
          setRecordingData({
            blob: audioBlob,
            type: blobType,
            duration: recordingTime,
          });
          
          // Only upload the final chunk if it hasn't been uploaded already
          // and if we're not in the process of uploading another chunk
          if (!finalChunkUploadedRef.current && !isChunkUploadInProgress.current) {
            // Check if this chunk index was already uploaded
            const chunkIndexToSend = currentChunkIndexRef.current;
            if (uploadedChunksRef.current.has(chunkIndexToSend)) {
              console.log(`Final chunk with index ${chunkIndexToSend} already uploaded, skipping`);
            } else {
              setIsUploading(true);
              isChunkUploadInProgress.current = true;
              try {
                await handleAudioUpload(audioBlob, currentChunkDuration, chunkIndexToSend, true);
                uploadedChunksRef.current.add(chunkIndexToSend);
                finalChunkUploadedRef.current = true; // Mark as uploaded
              } finally {
                isChunkUploadInProgress.current = false;
                setIsUploading(false);
              }
            }
          } else {
            console.log("Final chunk already uploaded or upload in progress, skipping duplicate upload");
          }
        }
        
        // Stop and clean up the microphone stream
        if (stream.current) {
          stream.current.getTracks().forEach(track => track.stop());
          stream.current = null;
        }
      };

      // Start recording
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Could not access microphone",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStopRecording = () => {
    setShowStopConfirm(true);
  };

  const confirmStopRecording = async () => {
    setShowStopConfirm(false);
    
    // Set recording state to false first to prevent parallel uploads
    setIsRecording(false);
    
    // Reset the final chunk upload flag
    finalChunkUploadedRef.current = false;
    
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      try {
        // First, explicitly request data to ensure we get the final chunk
        mediaRecorder.current.requestData();
        
        // Wait a moment for the data to be processed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Then stop the recorder which will trigger onstop event
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Error during stop recording:", error);
      }
    }
  };

  const handleAudioUpload = async (
    audioBlob: Blob,
    chunkDuration: number,
    chunkIndex: number,
    isLastChunk: boolean = false
  ) => {
    // Double-check that this chunk hasn't been uploaded yet
    if (uploadedChunksRef.current.has(chunkIndex)) {
      console.log(`Chunk ${chunkIndex} already uploaded, skipping duplicate upload`);
      return;
    }
    try {
      console.log(`Uploading chunk ${chunkIndex}, duration: ${chunkDuration}s, is last chunk: ${isLastChunk}`);
      
      // Create metadata for the chunk with all required fields
      const metadata = {
        fileName: `audio_${sessionId}_chunk_${chunkIndex}.${audioBlob.type.split('/')[1] || 'webm'}`,
        mimeType: audioBlob.type || 'audio/webm',
        duration: chunkDuration,
        size: audioBlob.size,
        dateRecorded: new Date().toISOString(),
        sampleRate: 44100, // Standard sample rate
        channels: 2,
        bitRate: mediaRecorder.current?.audioBitsPerSecond || 128000,
        chunkNumber: chunkIndex,
        sessionId: sessionId,
        isLastChunk: isLastChunk,
      };

      const response = await audioApi.uploadAudio(
        sessionId,
        audioBlob,
        metadata
      );

      if (response.success && response.data) {
        // Only trigger the onRecordingComplete callback when the recording is actually complete
        if (isLastChunk && onRecordingComplete) {
          // Only when recording is fully stopped
          onRecordingComplete(response.data.filename);
        }

        if (isLastChunk) {
          toast({
            title: "Recording uploaded successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          console.log(`Chunk ${chunkIndex} uploaded successfully`);
        }
      } else {
        throw new Error(response.error || "Failed to upload audio chunk");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReset = () => {
    setRecordingData(null);
    setRecordingTime(0);
    
    toast({
      title: "Reset complete",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Format seconds to MM:SS
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
      p={5}
      shadow="md"
      bg="white"
    >
      <VStack spacing={4} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Voice Recorder
          </Text>
          <Badge colorScheme={isRecording ? "red" : "green"} borderRadius="full" px={2}>
            {isRecording ? "Recording" : "Ready"}
          </Badge>
        </Flex>

        <Box>
          <Text textAlign="center" fontSize="2xl" fontWeight="bold" mb={2}>
            {formatTime(recordingTime)}
          </Text>
          {isRecording && (
            <>
              <Progress
                value={(currentChunkDuration / CHUNK_DURATION) * 100}
                colorScheme="red"
                size="sm"
                mb={2}
              />
              <Text fontSize="xs" color="gray.600" textAlign="center">
                Current chunk: {currentChunkDuration}s / {CHUNK_DURATION}s
              </Text>
            </>
          )}
        </Box>

        <Box>
          <HStack spacing={4} justify="center">
            {!isRecording && !recordingData && (
              <Tooltip label="Start Record">
                <Button
                  leftIcon={<FaMicrophone />}
                  colorScheme="blue"
                  onClick={startRecording}
                  isDisabled={isUploading}
                >
                  Start Record
                </Button>
              </Tooltip>
            )}

            {isRecording && (
              <Tooltip label="Stop Record">
                <Button
                  leftIcon={<FaStop />}
                  colorScheme="red"
                  onClick={handleStopRecording}
                >
                  Stop Record
                </Button>
              </Tooltip>
            )}
          </HStack>

          {/* Show recording success message instead of audio player */}
          {recordingData && !isRecording && (
            <Box mt={4} textAlign="center">
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Recording complete!</AlertTitle>
                  <AlertDescription>
                    Your audio recording has been successfully sent to our servers.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <Button 
                leftIcon={<FaUndo />} 
                onClick={handleReset}
                mt={4}
                colorScheme="blue"
                variant="outline"
              >
                Record Again
              </Button>
            </Box>
          )}
        </Box>

        {isUploading && (
          <Box textAlign="center">
            <Text mb={2}>Uploading recording...</Text>
            <Progress size="sm" isIndeterminate colorScheme="blue" />
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
