export interface RecordingData {
    blob: Blob;
    url: string;
    duration: number; // in seconds
}

export interface RecordingChunk {
    blob: Blob;
    timestamp: number; // in milliseconds
}