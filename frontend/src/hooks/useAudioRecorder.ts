import { useReactMediaRecorder } from 'react-media-recorder';
import { useCallback, useEffect } from 'react';
import useRecordingStore from '../store/recordingStore';

interface UseAudioRecorderProps {
  onRecordingComplete?: (blob: Blob, url: string) => void;
}

const useAudioRecorder = ({ onRecordingComplete }: UseAudioRecorderProps = {}) => {
  const { 
    isRecording, 
    startRecording: startRecordingState, 
    stopRecording: stopRecordingState,
    setRecordingData 
  } = useRecordingStore();

  const {
    status,
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    mediaBlobUrl,
    clearBlobUrl,
    previewStream,
    error
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    // Remove unsupported props but keep functionality
    mediaRecorderOptions: {
      audioBitsPerSecond: 128000
    }
  });

  const startRecording = useCallback(() => {
    clearBlobUrl();
    startMediaRecording();
    startRecordingState();
  }, [clearBlobUrl, startMediaRecording, startRecordingState]);

  const stopRecording = useCallback(() => {
    stopMediaRecording();
    stopRecordingState();
  }, [stopMediaRecording, stopRecordingState]);

  useEffect(() => {
    if (status === 'stopped' && mediaBlobUrl) {
      // Get the blob from the URL
      fetch(mediaBlobUrl)
        .then(response => response.blob())
        .then(blob => {
          const duration = 0; // In a real app, we would calculate this
          
          const recordingData = {
            blob: blob,
            url: mediaBlobUrl,
            duration
          };
          
          setRecordingData(recordingData);
          
          if (onRecordingComplete) {
            onRecordingComplete(blob, mediaBlobUrl);
          }
        });
    }
  }, [status, mediaBlobUrl, setRecordingData, onRecordingComplete]);

  return {
    isRecording,
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    previewStream,
    error
  };
};

export default useAudioRecorder;
