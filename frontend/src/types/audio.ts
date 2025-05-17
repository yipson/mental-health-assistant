export interface AudioMetadata {
    fileName: string;
    mimeType: string;
    duration: number;
    size: number;
    dateRecorded: string;
    sampleRate?: number;
    channels?: number;
    bitRate?: number;
    chunkNumber: number;
    sessionId: string;
    isLastChunk: boolean;
}

// Interface to match the backend AudioChunkResponse
export interface AudioChunkResponse {
    success: boolean;
    filename: string;
    chunkIndex: number;
    isLastChunk: boolean;
}