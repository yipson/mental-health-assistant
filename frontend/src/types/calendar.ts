export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    sessionId?: string;
    patientName?: string;
}