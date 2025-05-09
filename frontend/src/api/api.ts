import { ApiResponse, Session, Transcription, Summary, SessionStatus } from '../types';
import { mockApi } from './mockApi';
import axiosInstance from './axiosConfig';
import authService from './authService';

// Set to false to use real API
const USE_MOCK_API = false;

// Sessions API
export const sessionsApi = {
  getAllSessions: async (): Promise<ApiResponse<Session[]>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.getAllSessions();
        return { data, success: true };
      }
      
      // Real API implementation
      const response = await axiosInstance.get('/sessions');
      const sessions = response.data.map(mapSessionFromBackend);
      return { data: sessions, success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message, success: false };
    }
  },
  
  getSessionById: async (id: string): Promise<ApiResponse<Session>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.getSessionById(id);
        return { data, success: true };
      }
      
      // Real API implementation
      const response = await axiosInstance.get(`/sessions/${id}`);
      return { data: mapSessionFromBackend(response.data), success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message, success: false };
    }
  },
  
  createSession: async (sessionData: Omit<Session, 'id'>): Promise<ApiResponse<Session>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.createSession(sessionData);
        return { data, success: true };
      }
      
      // Real API implementation
      // Get the current user ID from auth service
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await axiosInstance.post('/sessions', {
        patientName: sessionData.patientName,
        date: sessionData.date,
        duration: sessionData.duration,
        status: mapSessionStatus(sessionData.status),
        notes: sessionData.notes || '',
        userId: currentUser.id
      });
      
      return { data: mapSessionFromBackend(response.data), success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message, success: false };
    }
  },
  
  updateSession: async (id: string, sessionData: Partial<Session>): Promise<ApiResponse<Session>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.updateSession(id, sessionData);
        return { data, success: true };
      }
      
      // Real API implementation
      const backendData: any = {};
      
      if (sessionData.patientName) backendData.patientName = sessionData.patientName;
      if (sessionData.date) backendData.date = sessionData.date;
      if (sessionData.duration) backendData.duration = sessionData.duration;
      if (sessionData.status) backendData.status = mapSessionStatus(sessionData.status);
      if (sessionData.notes !== undefined) backendData.notes = sessionData.notes;
      
      const response = await axiosInstance.put(`/sessions/${id}`, backendData);
      return { data: mapSessionFromBackend(response.data), success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message, success: false };
    }
  },
  
  deleteSession: async (id: string): Promise<ApiResponse<void>> => {
    try {
      if (USE_MOCK_API) {
        await mockApi.deleteSession(id);
        return { success: true };
      }
      
      // Real API implementation
      await axiosInstance.delete(`/sessions/${id}`);
      return { success: true };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message, success: false };
    }
  }
};

// Transcription API
export const transcriptionApi = {
  getTranscription: async (id: string): Promise<ApiResponse<Transcription>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.getTranscription(id);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
  
  createTranscription: async (sessionId: string, audioBlob: Blob): Promise<ApiResponse<Transcription>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.createTranscription(sessionId, audioBlob);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Summary API
export const summaryApi = {
  getSummary: async (id: string): Promise<ApiResponse<Summary>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.getSummary(id);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
  
  createSummary: async (transcriptionId: string): Promise<ApiResponse<Summary>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.createSummary(transcriptionId);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
};

// Helper functions for mapping between frontend and backend data formats
const mapSessionStatus = (frontendStatus: SessionStatus): string => {
  // Convert from lowercase-hyphenated to UPPERCASE_UNDERSCORE format
  switch (frontendStatus) {
    case SessionStatus.SCHEDULED: return 'SCHEDULED';
    case SessionStatus.IN_PROGRESS: return 'IN_PROGRESS';
    case SessionStatus.COMPLETED: return 'COMPLETED';
    case SessionStatus.CANCELLED: return 'CANCELLED';
    default: return 'SCHEDULED';
  }
};

const mapSessionStatusToFrontend = (backendStatus: string): SessionStatus => {
  // Convert from UPPERCASE_UNDERSCORE to lowercase-hyphenated format
  switch (backendStatus) {
    case 'SCHEDULED': return SessionStatus.SCHEDULED;
    case 'IN_PROGRESS': return SessionStatus.IN_PROGRESS;
    case 'COMPLETED': return SessionStatus.COMPLETED;
    case 'CANCELLED': return SessionStatus.CANCELLED;
    default: return SessionStatus.SCHEDULED;
  }
};

const mapSessionFromBackend = (backendSession: any): Session => {
  return {
    id: String(backendSession.id),
    patientName: backendSession.patientName,
    date: new Date(backendSession.date),
    duration: backendSession.duration,
    status: mapSessionStatusToFrontend(backendSession.status),
    notes: backendSession.notes,
    recordingUrl: backendSession.recordingUrl,
    transcriptionId: backendSession.transcriptionId,
    summaryId: backendSession.summaryId
  };
};

export default {
  sessions: sessionsApi,
  transcription: transcriptionApi,
  summary: summaryApi
};
