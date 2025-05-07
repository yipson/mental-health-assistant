import { ApiResponse, Session, Transcription, Summary } from '../types';
import { mockApi } from './mockApi';

// Use mock API for development
const USE_MOCK_API = true;

// Sessions API
export const sessionsApi = {
  getAllSessions: async (): Promise<ApiResponse<Session[]>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.getAllSessions();
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
  
  getSessionById: async (id: string): Promise<ApiResponse<Session>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.getSessionById(id);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
  
  createSession: async (sessionData: Omit<Session, 'id'>): Promise<ApiResponse<Session>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.createSession(sessionData);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
  
  updateSession: async (id: string, sessionData: Partial<Session>): Promise<ApiResponse<Session>> => {
    try {
      if (USE_MOCK_API) {
        const data = await mockApi.updateSession(id, sessionData);
        return { data, success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
  
  deleteSession: async (id: string): Promise<ApiResponse<void>> => {
    try {
      if (USE_MOCK_API) {
        await mockApi.deleteSession(id);
        return { success: true };
      }
      
      // Real API implementation would go here
      throw new Error('Real API not implemented yet');
    } catch (error: any) {
      return { error: error.message, success: false };
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

// Placeholder for the real API
const api = {
  // This would be replaced with a real API client
};

export default api;
