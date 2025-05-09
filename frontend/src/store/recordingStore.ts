import { create } from 'zustand';
import { RecordingData, RecordingChunk } from '../types';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingData: RecordingData | null;
  recordingChunks: RecordingChunk[];
  lastChunkUploadTime: number;
  transcriptionText: string | null;
  isTranscribing: boolean;
  isSummarizing: boolean;
  summary: string | null;
  audioLevel: number;
  
  // Recording actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  setRecordingData: (data: RecordingData | null) => void;
  addRecordingChunk: (chunk: RecordingChunk) => void;
  clearChunks: () => void;
  setLastChunkUploadTime: (time: number) => void;
  setAudioLevel: (level: number) => void;
  
  // Transcription actions
  startTranscribing: () => void;
  setTranscriptionText: (text: string | null) => void;
  stopTranscribing: () => void;
  
  // Summary actions
  startSummarizing: () => void;
  setSummary: (summary: string | null) => void;
  stopSummarizing: () => void;
  
  // Reset
  resetAll: () => void;
}

const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isPaused: false,
  recordingData: null,
  recordingChunks: [],
  lastChunkUploadTime: 0,
  transcriptionText: null,
  isTranscribing: false,
  isSummarizing: false,
  summary: null,
  audioLevel: 0,
  
  // Recording actions
  startRecording: () => set({ isRecording: true, isPaused: false }),
  pauseRecording: () => set({ isPaused: true }),
  resumeRecording: () => set({ isPaused: false }),
  stopRecording: () => set({ isRecording: false, isPaused: false }),
  setRecordingData: (data) => set({ recordingData: data }),
  addRecordingChunk: (chunk) => set((state) => ({ 
    recordingChunks: [...state.recordingChunks, chunk] 
  })),
  clearChunks: () => set({ recordingChunks: [] }),
  setLastChunkUploadTime: (time) => set({ lastChunkUploadTime: time }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  
  // Transcription actions
  startTranscribing: () => set({ isTranscribing: true }),
  setTranscriptionText: (text) => set({ transcriptionText: text }),
  stopTranscribing: () => set({ isTranscribing: false }),
  
  // Summary actions
  startSummarizing: () => set({ isSummarizing: true }),
  setSummary: (summary) => set({ summary }),
  stopSummarizing: () => set({ isSummarizing: false }),
  
  // Reset
  resetAll: () => set({
    isRecording: false,
    isPaused: false,
    recordingData: null,
    recordingChunks: [],
    lastChunkUploadTime: 0,
    transcriptionText: null,
    isTranscribing: false,
    isSummarizing: false,
    summary: null,
    audioLevel: 0
  })
}));

export default useRecordingStore;
