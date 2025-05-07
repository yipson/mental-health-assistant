import { create } from 'zustand';
import { Session, SessionStatus } from '../types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, sessionData: Partial<Session>) => void;
  deleteSession: (sessionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  addSession: (session) => set((state) => ({ 
    sessions: [...state.sessions, session] 
  })),
  updateSession: (sessionId, sessionData) => set((state) => ({
    sessions: state.sessions.map((session) => 
      session.id === sessionId ? { ...session, ...sessionData } : session
    ),
    currentSession: state.currentSession?.id === sessionId 
      ? { ...state.currentSession, ...sessionData } 
      : state.currentSession
  })),
  deleteSession: (sessionId) => set((state) => ({
    sessions: state.sessions.filter((session) => session.id !== sessionId),
    currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
}));

export default useSessionStore;
