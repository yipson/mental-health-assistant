export interface AudioMetadata {
    fileName: string;
    mimeType: string;
    duration: number;
    size: number;
    dateRecorded: string;
    sampleRate?: number;
    channels?: number;
    bitRate?: number;
}