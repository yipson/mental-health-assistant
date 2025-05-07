import { v4 as uuidv4 } from 'uuid';
import { Session, SessionStatus, Transcription, Summary } from '../types';

// Mock data for sessions
const mockSessions: Session[] = [
  {
    id: '1',
    patientName: 'John Doe',
    date: new Date('2025-05-08T10:00:00'),
    duration: 60,
    status: SessionStatus.SCHEDULED,
    notes: 'Initial consultation session'
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    date: new Date('2025-05-07T14:30:00'),
    duration: 45,
    status: SessionStatus.COMPLETED,
    notes: 'Follow-up session',
    recordingUrl: 'https://example.com/recordings/2',
    transcriptionId: '1',
    summaryId: '1'
  },
  {
    id: '3',
    patientName: 'Michael Johnson',
    date: new Date('2025-05-06T09:15:00'),
    duration: 30,
    status: SessionStatus.CANCELLED,
    notes: 'Cancelled due to illness'
  },
  {
    id: '4',
    patientName: 'Emily Wilson',
    date: new Date('2025-05-09T16:00:00'),
    duration: 60,
    status: SessionStatus.SCHEDULED,
    notes: 'Anxiety assessment'
  },
  {
    id: '5',
    patientName: 'Robert Brown',
    date: new Date('2025-05-07T11:00:00'),
    duration: 90,
    status: SessionStatus.IN_PROGRESS,
    notes: 'Therapy session',
    recordingUrl: 'https://example.com/recordings/5'
  }
];

// Mock data for transcriptions
const mockTranscriptions: Transcription[] = [
  {
    id: '1',
    sessionId: '2',
    text: `Psychologist: Hello Jane, how are you feeling today?\n\nPatient: I'm feeling better than last week. The exercises you suggested have been helping with my anxiety.\n\nPsychologist: That's great to hear. Can you tell me more about how the exercises have been working for you?\n\nPatient: Well, the breathing techniques really help when I feel a panic attack coming on. And the journaling has made me more aware of my triggers.\n\nPsychologist: Excellent. Awareness is a key step. Have you noticed any patterns in your triggers?\n\nPatient: Yes, I've noticed that work deadlines are a major trigger, especially when I feel unprepared.\n\nPsychologist: That's a valuable insight. Let's work on some strategies to help you feel more prepared and confident with deadlines.`,
    createdAt: new Date('2025-05-07T15:30:00')
  }
];

// Mock data for summaries
const mockSummaries: Summary[] = [
  {
    id: '1',
    sessionId: '2',
    text: `# Session Summary with Jane Smith

## Key Points
- Patient reports improvement since last session
- Breathing techniques have been effective for managing panic attacks
- Journaling has increased awareness of anxiety triggers
- Work deadlines identified as a major trigger, especially when feeling unprepared

## Assessment
The patient shows good progress with the previously assigned techniques. She demonstrates increased self-awareness and has successfully identified specific triggers for her anxiety.

## Plan
1. Continue with breathing exercises and journaling
2. Develop strategies for deadline preparation and confidence building
3. Explore time management techniques
4. Consider gradual exposure to deadline-related stress in controlled environments`,
    keyPoints: [
      'Improvement since last session',
      'Breathing techniques effective',
      'Work deadlines are major trigger',
      'Journaling increasing self-awareness'
    ],
    createdAt: new Date('2025-05-07T15:45:00')
  }
];

// Delay helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API implementation
export const mockApi = {
  // Sessions
  getAllSessions: async () => {
    await delay(800);
    return [...mockSessions];
  },
  
  getSessionById: async (id: string) => {
    await delay(500);
    const session = mockSessions.find(s => s.id === id);
    if (!session) {
      throw new Error('Session not found');
    }
    return { ...session };
  },
  
  createSession: async (sessionData: Omit<Session, 'id'>) => {
    await delay(1000);
    const newSession: Session = {
      ...sessionData,
      id: uuidv4()
    };
    mockSessions.push(newSession);
    return { ...newSession };
  },
  
  updateSession: async (id: string, sessionData: Partial<Session>) => {
    await delay(800);
    const index = mockSessions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Session not found');
    }
    
    const updatedSession = {
      ...mockSessions[index],
      ...sessionData
    };
    mockSessions[index] = updatedSession;
    return { ...updatedSession };
  },
  
  deleteSession: async (id: string) => {
    await delay(700);
    const index = mockSessions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Session not found');
    }
    mockSessions.splice(index, 1);
  },
  
  // Transcriptions
  getTranscription: async (id: string) => {
    await delay(600);
    const transcription = mockTranscriptions.find(t => t.id === id);
    if (!transcription) {
      throw new Error('Transcription not found');
    }
    return { ...transcription };
  },
  
  createTranscription: async (sessionId: string, audioBlob: Blob) => {
    await delay(2000); // Longer delay to simulate transcription processing
    
    // In a real app, this would send the audio to a backend service
    // For mock purposes, we'll create a fake transcription
    const newTranscription: Transcription = {
      id: uuidv4(),
      sessionId,
      text: `Psychologist: Hello, how are you feeling today?\n\nPatient: I've been feeling a bit anxious lately, especially at work.\n\nPsychologist: I understand. Can you tell me more about what's causing this anxiety at work?\n\nPatient: I think it's the pressure of deadlines and the fear of not meeting expectations.\n\nPsychologist: That's a common concern. Let's talk about some strategies to help manage this work-related anxiety.`,
      createdAt: new Date()
    };
    
    mockTranscriptions.push(newTranscription);
    return { ...newTranscription };
  },
  
  // Summaries
  getSummary: async (id: string) => {
    await delay(600);
    const summary = mockSummaries.find(s => s.id === id);
    if (!summary) {
      throw new Error('Summary not found');
    }
    return { ...summary };
  },
  
  createSummary: async (transcriptionId: string) => {
    await delay(3000); // Longer delay to simulate AI processing
    
    // Find the transcription
    const transcription = mockTranscriptions.find(t => t.id === transcriptionId);
    if (!transcription) {
      throw new Error('Transcription not found');
    }
    
    // In a real app, this would send the transcription to an AI service
    // For mock purposes, we'll create a fake summary
    const newSummary: Summary = {
      id: uuidv4(),
      sessionId: transcription.sessionId,
      text: `# Session Summary\n\n## Key Points\n- Patient reports feeling anxious, particularly at work\n- Pressure of deadlines and fear of not meeting expectations identified as main stressors\n- Patient shows awareness of their anxiety triggers\n\n## Assessment\nThe patient is experiencing work-related anxiety centered around performance expectations and deadlines. They demonstrate good insight into their condition.\n\n## Plan\n1. Develop stress management techniques specific to workplace situations\n2. Practice time management and prioritization strategies\n3. Consider mindfulness exercises before and during work\n4. Explore cognitive restructuring for negative thought patterns about performance`,
      keyPoints: [
        'Work-related anxiety',
        'Deadline pressure',
        'Fear of not meeting expectations',
        'Good insight into condition'
      ],
      createdAt: new Date()
    };
    
    mockSummaries.push(newSummary);
    return { ...newSummary };
  }
};

export default mockApi;
