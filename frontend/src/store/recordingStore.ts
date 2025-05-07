import { create } from 'zustand';
import { RecordingData } from '../types';

interface RecordingState {
  isRecording: boolean;
  recordingData: RecordingData | null;
  transcriptionText: string | null;
  isTranscribing: boolean;
  isSummarizing: boolean;
  summary: string | null;
  
  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  setRecordingData: (data: RecordingData | null) => void;
  startTranscribing: () => void;
  setTranscriptionText: (text: string | null) => void;
  stopTranscribing: () => void;
  startSummarizing: () => void;
  setSummary: (summary: string | null) => void;
  stopSummarizing: () => void;
  resetAll: () => void;
}

const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  recordingData: null,
  transcriptionText: null,
  isTranscribing: false,
  isSummarizing: false,
  summary: null,
  
  startRecording: () => set({ isRecording: true }),
  stopRecording: () => set({ isRecording: false }),
  setRecordingData: (data) => set({ recordingData: data }),
  startTranscribing: () => set({ isTranscribing: true }),
  setTranscriptionText: (text) => set({ transcriptionText: text }),
  stopTranscribing: () => set({ isTranscribing: false }),
  startSummarizing: () => set({ isSummarizing: true }),
  setSummary: (summary) => set({ summary }),
  stopSummarizing: () => set({ isSummarizing: false }),
  resetAll: () => set({
    isRecording: false,
    recordingData: null,
    transcriptionText: null,
    isTranscribing: false,
    isSummarizing: false,
    summary: null
  })
}));

export default useRecordingStore;
