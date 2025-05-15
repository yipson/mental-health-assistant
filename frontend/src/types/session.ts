export enum SessionStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

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