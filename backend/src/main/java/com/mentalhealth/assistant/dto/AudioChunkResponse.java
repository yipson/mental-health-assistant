package com.mentalhealth.assistant.dto;

public class AudioChunkResponse {
    private final boolean success;
    private final String filename;
    private final int chunkIndex;
    private final boolean isLastChunk;
    
    public AudioChunkResponse(boolean success, String filename, int chunkIndex, boolean isLastChunk) {
        this.success = success;
        this.filename = filename;
        this.chunkIndex = chunkIndex;
        this.isLastChunk = isLastChunk;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public String getFilename() {
        return filename;
    }
    
    public int getChunkIndex() {
        return chunkIndex;
    }
    
    public boolean isLastChunk() {
        return isLastChunk;
    }
}