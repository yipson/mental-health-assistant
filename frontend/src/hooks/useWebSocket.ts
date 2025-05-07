import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketProps {
  url: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
}

const useWebSocket = ({
  url,
  onConnect,
  onDisconnect,
  onMessage,
  onError
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(url, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up event listeners
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      if (onConnect) onConnect();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      if (onDisconnect) onDisconnect();
    });

    socketRef.current.on('message', (data) => {
      if (onMessage) onMessage(data);
    });

    socketRef.current.on('error', (error) => {
      if (onError) onError(error);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, onConnect, onDisconnect, onMessage, onError]);

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, [isConnected]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    disconnect,
    socket: socketRef.current
  };
};

export default useWebSocket;
