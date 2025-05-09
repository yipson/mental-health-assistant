// Session Types
export interface Session {
  id: string;
  patientName: string;
  date: Date;
  duration: number; // in minutes
  status: SessionStatus;
  notes?: string;
  recordingUrl?: string;
  transcriptionId?: string;
  summaryId?: string;
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Transcription Types
export interface Transcription {
  id: string;
  sessionId: string;
  text: string;
  createdAt: Date;
}

// Summary Types
export interface Summary {
  id: string;
  sessionId: string;
  text: string;
  keyPoints: string[];
  createdAt: Date;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  PSYCHOLOGIST = 'psychologist',
  ADMIN = 'admin'
}

// Recording Types
export interface RecordingData {
  blob: Blob;
  url: string;
  duration: number; // in seconds
}

export interface RecordingChunk {
  blob: Blob;
  timestamp: number; // in milliseconds
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  sessionId?: string;
  patientName?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
