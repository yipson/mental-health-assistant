import { useState, useCallback, useEffect, useRef } from 'react';
import useRecordingStore from '../store/recordingStore';

interface UseAudioRecorderProps {
  onRecordingComplete?: (blob: Blob, url: string) => void;
  onChunkRecorded?: (chunk: Blob, timestamp: number) => void;
  chunkSize?: number; // in milliseconds
}

const useAudioRecorder = ({
  onRecordingComplete,
  onChunkRecorded,
  chunkSize = 10000 // Default to 10 seconds chunks
}: UseAudioRecorderProps = {}) => {
  const { 
    isRecording, 
    isPaused,
    startRecording: startRecordingState, 
    pauseRecording: pauseRecordingState,
    resumeRecording: resumeRecordingState,
    stopRecording: stopRecordingState,
    setRecordingData,
    addRecordingChunk
  } = useRecordingStore();

  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const chunkInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<number>(0);
  const recordingDuration = useRef<number>(0);
  const pauseStartTime = useRef<number>(0);
  const totalPausedTime = useRef<number>(0);
  const audioContext = useRef<AudioContext | null>(null);
  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioDataArray = useRef<Uint8Array | null>(null);

  // Initialize audio context for visualization
  const initAudioContext = useCallback((streamToAnalyze: MediaStream) => {
    try {
      // Clean up existing audio context if it exists
      if (audioContext.current) {
        audioContext.current.close().catch(console.error);
        audioContext.current = null;
        audioAnalyser.current = null;
        audioDataArray.current = null;
      }
      
      // Create new audio context
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioAnalyser.current = audioContext.current.createAnalyser();
      audioAnalyser.current.fftSize = 256;
      
      const source = audioContext.current.createMediaStreamSource(streamToAnalyze);
      source.connect(audioAnalyser.current);
      
      const bufferLength = audioAnalyser.current.frequencyBinCount;
      audioDataArray.current = new Uint8Array(bufferLength);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, []);

  // Get current audio levels for visualization
  const getAudioLevel = useCallback(() => {
    if (audioAnalyser.current && audioDataArray.current) {
      try {
        audioAnalyser.current.getByteFrequencyData(audioDataArray.current);
        // Calculate average level
        const sum = audioDataArray.current.reduce((acc, val) => acc + val, 0);
        return sum / audioDataArray.current.length / 255; // Normalize to 0-1
      } catch (error) {
        console.error('Error getting audio level:', error);
        return 0;
      }
    }
    return 0;
  }, []);

  // Clear recording resources
  const clearRecording = useCallback(() => {
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
      stream.current = null;
    }
    
    if (chunkInterval.current) {
      clearInterval(chunkInterval.current);
      chunkInterval.current = null;
    }
    
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
      audioAnalyser.current = null;
      audioDataArray.current = null;
    }
    
    audioChunks.current = [];
    recordingStartTime.current = 0;
    pauseStartTime.current = 0;
    totalPausedTime.current = 0;
  }, []);

  // Clear blob URL to prevent memory leaks
  const clearBlobUrl = useCallback(() => {
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl);
      setMediaBlobUrl(null);
    }
  }, [mediaBlobUrl]);

  // Process a recorded chunk
  const processChunk = useCallback((timestamp: number) => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.requestData(); // This will trigger the dataavailable event
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      clearBlobUrl();
      audioChunks.current = [];
      recordingDuration.current = 0;
      totalPausedTime.current = 0;
      
      // Request microphone access
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio context for visualization
      initAudioContext(stream.current);
      
      // Create media recorder
      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      // Handle data available event (chunks)
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          
          // Calculate current timestamp
          const now = Date.now();
          const elapsed = now - recordingStartTime.current - totalPausedTime.current;
          
          // Store chunk in the store
          addRecordingChunk({
            blob: event.data,
            timestamp: elapsed
          });
          
          // Notify via callback if provided
          if (onChunkRecorded) {
            onChunkRecorded(event.data, elapsed);
          }
        }
      };
      
      // Start recording
      mediaRecorder.current.start();
      recordingStartTime.current = Date.now();
      
      // Set up interval to request data periodically
      chunkInterval.current = setInterval(() => {
        processChunk(Date.now() - recordingStartTime.current - totalPausedTime.current);
      }, chunkSize);
      
      setStatus('recording');
      startRecordingState();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      clearRecording();
    }
  }, [clearBlobUrl, initAudioContext, processChunk, startRecordingState, addRecordingChunk, onChunkRecorded, chunkSize]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      pauseStartTime.current = Date.now();
      
      if (chunkInterval.current) {
        clearInterval(chunkInterval.current);
        chunkInterval.current = null;
      }
      
      setStatus('paused');
      pauseRecordingState();
    }
  }, [pauseRecordingState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      
      // Update total paused time
      if (pauseStartTime.current > 0) {
        totalPausedTime.current += (Date.now() - pauseStartTime.current);
        pauseStartTime.current = 0;
      }
      
      // Restart chunk interval
      chunkInterval.current = setInterval(() => {
        processChunk(Date.now() - recordingStartTime.current - totalPausedTime.current);
      }, chunkSize);
      
      setStatus('recording');
      resumeRecordingState();
    }
  }, [resumeRecordingState, processChunk, chunkSize]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current) {
      // If paused, calculate final paused time
      if (mediaRecorder.current.state === 'paused' && pauseStartTime.current > 0) {
        totalPausedTime.current += (Date.now() - pauseStartTime.current);
      }
      
      // Calculate total duration
      recordingDuration.current = Date.now() - recordingStartTime.current - totalPausedTime.current;
      
      // Request final chunk
      if (mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.requestData();
      }
      
      // Stop the recorder
      mediaRecorder.current.stop();
      
      // Combine all chunks into a single blob
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setMediaBlobUrl(audioUrl);
      setStatus('stopped');
      
      // Save to store
      setRecordingData({
        blob: audioBlob,
        url: audioUrl,
        duration: Math.round(recordingDuration.current / 1000) // Convert to seconds
      });
      
      // Notify via callback
      if (onRecordingComplete) {
        onRecordingComplete(audioBlob, audioUrl);
      }
      
      // Clean up
      clearRecording();
      stopRecordingState();
    }
  }, [clearRecording, onRecordingComplete, setRecordingData, stopRecordingState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearRecording();
      clearBlobUrl();
    };
  }, [clearRecording, clearBlobUrl]);

  return {
    isRecording,
    isPaused,
    status,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    getAudioLevel,
    error
  };
};

export default useAudioRecorder;
