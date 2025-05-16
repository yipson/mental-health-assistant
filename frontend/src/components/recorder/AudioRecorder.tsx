import React, { useEffect, useState, useRef, FC } from "react";
import {
  Box, 
  Button, 
  Flex, 
  Text, 
  VStack, 
  HStack, 
  Progress, 
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton
} from "@chakra-ui/react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { audioApi } from "../../api/api";

// Duración de cada chunk de audio en segundos
const CHUNK_DURATION = 5;

interface AudioRecorderProps {
  sessionId: string;
  onRecordingComplete?: (filename: string) => void;
}

interface RecordingData {
  blob: Blob;
  duration: number;
  type: string;
}

const AudioRecorder: FC<AudioRecorderProps> = ({ sessionId, onRecordingComplete }) => {
  // Estados
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showStopConfirm, setShowStopConfirm] = useState<boolean>(false);
  const [currentChunkDuration, setCurrentChunkDuration] = useState<number>(0);

  // Referencias
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const uploadedChunksRef = useRef<Set<number>>(new Set());
  const isChunkProcessingRef = useRef<boolean>(false);
  const cancelRef = useRef<HTMLButtonElement>(null); // Para AlertDialog

  const toast = useToast();
  
  // Efecto para manejar los temporizadores durante la grabación
  useEffect(() => {
    console.log(`Estado de grabación cambiado: ${isRecording ? 'GRABANDO' : 'DETENIDO'}`);
    
    if (isRecording) {
      console.log('Iniciando temporizadores para la grabación');
      
      // Intervalo para tiempo de grabación total
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Intervalo para tiempo de chunk actual
      chunkerIntervalRef.current = setInterval(() => {
        setCurrentChunkDuration(prev => {
          const newDuration = prev + 1;
          console.log(`Duración de chunk actual: ${newDuration}s de ${CHUNK_DURATION}s máximo, Chunk #${currentChunkIndexRef.current}`);
          
          if (newDuration >= CHUNK_DURATION) {
            console.log(`CHUNK COMPLETO: Chunk #${currentChunkIndexRef.current} alcanzó duración máxima`);
            // Procesamos el chunk cuando alcanza la duración máxima
            // Importante: Ejecutamos esto de forma síncrona para evitar problemas de timing
            handleChunkComplete();
            return 0;
          }
          return newDuration;
        });
      }, 1000);
    } else {
      console.log('Deteniendo temporizadores de grabación');
      
      // Limpiar intervalos cuando no está grabando
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        console.log('Timer de grabación total detenido');
      }
      if (chunkerIntervalRef.current) {
        clearInterval(chunkerIntervalRef.current);
        chunkerIntervalRef.current = null;
        console.log('Timer de chunks detenido');
      }
    }

    // Limpieza al desmontar
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (chunkerIntervalRef.current) clearInterval(chunkerIntervalRef.current);
    };
  }, [isRecording]);
  
  // Función para iniciar una nueva instancia de grabación
  // Esto asegura que cada chunk tenga encabezados WebM completos
  const startNewRecorder = async (): Promise<void> => {
    try {
      // Detener cualquier stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      
      // Solicitar nuevo acceso al micrófono
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Seleccionar formato de audio adecuado (priorizar WebM)
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp3")) {
        mimeType = "audio/mp3";
      } else if (MediaRecorder.isTypeSupported("audio/wav")) {
        mimeType = "audio/wav";
      }
      
      console.log("Formato de audio usado:", mimeType || "predeterminado del navegador");
      
      // Crear nueva instancia de grabación
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000 // Optimizado para voz
      });
      
      // Reiniciar el arreglo de chunks para esta nueva grabación
      // Esto es crítico para que cada chunk tenga sus propios datos independientes
      audioChunksRef.current = [];
      console.log('Array de chunks reiniciado para nueva grabación');
      
      // Configurar handler para capturar datos
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`Datos de audio disponibles: ${event.data.size} bytes, total chunks: ${audioChunksRef.current.length}`);
        } else {
          console.warn('Se recibió un evento ondataavailable pero el tamaño de datos es 0');
        }
      };
      
      // Configurar handler para cuando se detenga la grabación
      mediaRecorderRef.current.onstop = async () => {
        // Determinar si estamos en proceso de chunking o si es una detención manual
        const isChunking = isChunkingRef.current;
        // Si estamos en proceso de chunking, forzar el estado de grabación a true
        // para asegurar que se continue con el siguiente chunk
        const shouldContinueRecording = isChunking ? true : isRecording;
        
        console.log(`EVENTO ONSTOP: Grabación detenida para chunk ${currentChunkIndexRef.current}, isRecording=${isRecording}, isChunking=${isChunking}, shouldContinueRecording=${shouldContinueRecording}`);
        
        // Esperar un poco para asegurar que todos los datos fueron recogidos
        console.log(`Esperando para asegurar que todos los datos fueron recogidos...`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log(`Chunks de audio acumulados: ${audioChunksRef.current.length}`);
        if (audioChunksRef.current.length > 0) {
          // Crear blob con todos los chunks acumulados
          // Importante: Cada blob tendrá sus propios encabezados WebM completos
          // porque estamos creando una nueva instancia de MediaRecorder para cada chunk
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || "audio/webm" 
          });
          
          console.log(`Chunk ${currentChunkIndexRef.current} listo: ${audioBlob.size} bytes, tipo: ${audioBlob.type}`);
          
          // Verificar que este chunk no se haya subido ya
          if (!uploadedChunksRef.current.has(currentChunkIndexRef.current)) {
            console.log(`Subiendo chunk #${currentChunkIndexRef.current} (no subido previamente)`);
            // Subir el chunk
            await uploadChunk(audioBlob, currentChunkDuration, currentChunkIndexRef.current);
          } else {
            console.log(`Chunk #${currentChunkIndexRef.current} ya fue subido anteriormente, omitiendo`);
          }
          
          // Continuar grabando si estamos en proceso de chunking o si la grabación sigue activa
          if (shouldContinueRecording) {
            console.log(`Continuando grabación, incrementando índice de chunk a ${currentChunkIndexRef.current + 1}`);
            currentChunkIndexRef.current++;
            setCurrentChunkDuration(0);
            
            // Iniciar nueva instancia de grabación para el siguiente chunk
            console.log(`Iniciando nueva instancia de grabación para chunk #${currentChunkIndexRef.current}`);
            await startNewRecorder();
            // Desmarcar el proceso de chunking una vez que se ha iniciado la nueva grabación
            isChunkingRef.current = false;
          } else {
            console.log(`Grabación detenida, no se iniciará un nuevo chunk`);
          }
        } else {
          console.warn(`No hay datos de audio acumulados para el chunk ${currentChunkIndexRef.current}`);
        }
      };
      
      // Limpiar el array de chunks de audio antes de iniciar la grabación
      audioChunksRef.current = [];
      
      // Iniciar la grabación con un timeslice para obtener datos periódicamente
      // Un valor más pequeño asegura que se generen eventos ondataavailable más frecuentemente
      mediaRecorderRef.current.start(500); // Generar datos cada 500ms
      console.log(`Nueva grabación iniciada para chunk ${currentChunkIndexRef.current}`);
      
    } catch (error) {
      console.error("Error al iniciar grabación:", error);
      toast({
        title: "Error de grabación",
        description: error instanceof Error ? error.message : "No se pudo acceder al micrófono",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  // Variable para rastrear si estamos en medio de un proceso de chunking
  // Esto evita que el estado isRecording se cambie durante el proceso
  const isChunkingRef = useRef<boolean>(false);
  
  // Función para manejar la finalización de un chunk
  const handleChunkComplete = async (): Promise<void> => {
    console.log(`ENTRANDO a handleChunkComplete, isRecording=${isRecording}, isChunkProcessing=${isChunkProcessingRef.current}`);
    
    // Verificar si ya estamos procesando un chunk o si la grabación se ha detenido
    if (!isRecording || isChunkProcessingRef.current) {
      console.log(`SALIENDO de handleChunkComplete - condiciones no cumplidas`);
      return;
    }
    
    try {
      console.log(`INICIANDO procesamiento de chunk #${currentChunkIndexRef.current}`);
      isChunkProcessingRef.current = true;
      isChunkingRef.current = true; // Marcar que estamos en proceso de chunking
      
      // Verificar si el MediaRecorder está activo y grabando
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        console.log(`Completando chunk ${currentChunkIndexRef.current}... Estado del MediaRecorder: ${mediaRecorderRef.current.state}`);
        
        // Solicitar los datos acumulados hasta ahora
        console.log(`Solicitando datos acumulados para chunk #${currentChunkIndexRef.current}`);
        mediaRecorderRef.current.requestData();
        
        // Esperar un poco para asegurar que los datos se hayan procesado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar nuevamente el estado de grabación después de la espera
        // Esto es crucial para evitar detener el MediaRecorder si el usuario ha detenido la grabación manualmente
        if (!isRecording) {
          console.warn(`La grabación se detuvo durante el procesamiento del chunk ${currentChunkIndexRef.current}`);
          isChunkProcessingRef.current = false;
          isChunkingRef.current = false; // Desmarcar proceso de chunking
          return;
        }
        
        // Verificar nuevamente que el MediaRecorder sigue en estado de grabación
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          // Detener la grabación para forzar el evento onstop
          console.log(`Deteniendo MediaRecorder para chunk #${currentChunkIndexRef.current}`);
          mediaRecorderRef.current.stop();
          console.log(`MediaRecorder detenido para chunk #${currentChunkIndexRef.current}`);
          // El evento onstop se encargará de iniciar la siguiente grabación
        } else {
          console.warn(`MediaRecorder ya no está grabando, no se detuvo: ${mediaRecorderRef.current?.state || 'null'}`);
          isChunkingRef.current = false; // Desmarcar proceso de chunking
        }
      } else {
        console.warn(`No se pudo completar chunk ${currentChunkIndexRef.current}: MediaRecorder no está grabando o es null`);
        isChunkingRef.current = false; // Desmarcar proceso de chunking
      }
    } catch (error) {
      console.error(`ERROR al procesar chunk #${currentChunkIndexRef.current}:`, error);
      isChunkingRef.current = false; // Desmarcar proceso de chunking en caso de error
    } finally {
      console.log(`Finalizando procesamiento de chunk #${currentChunkIndexRef.current}`);
      isChunkProcessingRef.current = false;
    }
  };
  
  // Función para subir un chunk de audio al servidor
  const uploadChunk = async (blob: Blob, duration: number, chunkIndex: number): Promise<void> => {
    // Determinar si estamos en proceso de chunking o si es una detención manual
    const isChunking = isChunkingRef.current;
    // Capturar el estado actual de grabación para determinar si es el último chunk
    const currentRecordingState = isChunking ? true : isRecording;
    // Solo consideramos que es el último chunk si explícitamente se ha detenido la grabación
    // y no estamos en proceso de chunking
    const isLastChunk = !currentRecordingState && !isChunking && currentChunkIndexRef.current === chunkIndex;
    
    try {
      setIsUploading(true);
      console.log(`SUBIENDO CHUNK #${chunkIndex}, tamaño: ${blob.size} bytes, tipo: ${blob.type}, último chunk: ${isLastChunk}`);
      
      // Verificar que el blob tenga un tamaño razonable para contener encabezados
      if (blob.size < 100) {
        console.warn(`ADVERTENCIA: Chunk #${chunkIndex} demasiado pequeño (${blob.size} bytes), posiblemente sin encabezados válidos`);
      }
      
      // Metadatos para el backend
      const metadata = {
        fileName: `audio_${sessionId}_chunk_${chunkIndex}.webm`,
        mimeType: "audio/webm", // Forzar webm para compatibilidad
        duration: duration,
        size: blob.size,
        dateRecorded: new Date().toISOString(),
        sampleRate: 44100,
        channels: 2,
        bitRate: mediaRecorderRef.current?.audioBitsPerSecond || 128000,
        chunkNumber: chunkIndex,
        sessionId: sessionId.toString(), // Convertir a string como espera la interfaz AudioMetadata
        isLastChunk: isLastChunk
      };
      
      console.log(`Enviando chunk #${chunkIndex} al servidor con metadata:`, metadata);
      
      // Llamar a la API para subir el audio
      const response = await audioApi.uploadAudio(
        sessionId, // Ya es string, no necesita conversión
        blob,
        metadata
      );
      
      if (response.success && response.data) {
        console.log(`ÉXITO: Chunk #${chunkIndex} subido correctamente, respuesta:`, response.data);
        uploadedChunksRef.current.add(chunkIndex);
        console.log(`Chunks subidos hasta ahora: ${Array.from(uploadedChunksRef.current).join(', ')}`);
        
        // Si es el último chunk, notificar que la grabación está completa
        if (isLastChunk && onRecordingComplete) {
          console.log(`Notificando que la grabación está completa con filename: ${response.data.filename}`);
          onRecordingComplete(response.data.filename);
          
          toast({
            title: "Grabación completa subida correctamente",
            description: "Todos los chunks de audio han sido procesados",
            status: "success",
            duration: 3000,
            isClosable: true
          });
        } else {
          // Notificar que el chunk se ha subido correctamente, pero no es el último
          toast({
            title: `Chunk #${chunkIndex} subido correctamente`,
            description: "Continuando grabación...",
            status: "info",
            duration: 1500,
            isClosable: true
          });
        }
      } else {
        console.error(`ERROR: Respuesta fallida al subir chunk #${chunkIndex}:`, response.error);
        throw new Error(response.error || "Error al subir audio");
      }
    } catch (error) {
      console.error(`ERROR AL SUBIR CHUNK #${chunkIndex}:`, error);
      toast({
        title: "Error al subir audio",
        description: error instanceof Error ? error.message : "Error desconocido",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      console.log(`Finalizando proceso de subida para chunk #${chunkIndex}, isUploading = false`);
      setIsUploading(false);
    }
  };
  
  // Iniciar grabación
  const startRecording = async (): Promise<void> => {
    try {
      console.log('INICIANDO GRABACIÓN');
      
      // Reiniciar estados y referencias
      setRecordingTime(0);
      setCurrentChunkDuration(0);
      currentChunkIndexRef.current = 0;
      uploadedChunksRef.current = new Set();
      console.log('Estados y referencias reiniciados');
      
      // Establecer estado de grabación
      setIsRecording(true);
      console.log('Estado de grabación establecido a TRUE');
      
      // Iniciar nueva grabación
      console.log('Llamando a startNewRecorder para iniciar la grabación');
      await startNewRecorder();
      console.log('Grabación iniciada correctamente');
    } catch (error) {
      console.error("ERROR AL INICIAR GRABACIÓN:", error);
      setIsRecording(false);
      toast({
        title: "Error de grabación",
        description: error instanceof Error ? error.message : "No se pudo iniciar la grabación",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  // Dialog para confirmar detener grabación
  const handleStopButtonClick = (): void => {
    setShowStopConfirm(true);
  };
  
  // Cancelar detener grabación
  const cancelStopRecording = (): void => {
    setShowStopConfirm(false);
  };
  
  // Confirmar detener grabación
  const confirmStopRecording = (): void => {
    console.log('CONFIRMANDO DETENER GRABACIÓN');
    setShowStopConfirm(false);
    
    // Primero solicitar datos acumulados antes de detener
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log('Solicitando últimos datos antes de detener grabación');
      mediaRecorderRef.current.requestData();
    }
    
    // Establecer estado de grabación a false
    console.log('Estableciendo isRecording = false');
    setIsRecording(false);
    
    // Detener la grabación actual
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log('Deteniendo MediaRecorder');
      mediaRecorderRef.current.stop();
    } else {
      console.log(`No se detuvo MediaRecorder: ${mediaRecorderRef.current ? mediaRecorderRef.current.state : 'null'}`);
    }
    
    // Detener el stream de audio
    if (streamRef.current) {
      console.log('Deteniendo stream de audio');
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    
    console.log('Grabación detenida completamente');
  };
  
  // Formatear tiempo en MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      boxShadow="md"
      bg="white"
      width="100%"
    >
      <VStack spacing={4} align="stretch">
        {/* Estado de grabación */}
        <HStack justify="space-between">
          <Text fontWeight="bold">
            {isRecording
              ? `Grabando: ${formatTime(recordingTime)}`
              : "Listo para grabar"}
          </Text>
          
          {isRecording && (
            <Text fontSize="sm">
              Chunk actual: {formatTime(currentChunkDuration)} / {formatTime(CHUNK_DURATION)}
            </Text>
          )}
        </HStack>

        {/* Barra de progreso para el chunk actual */}
        {isRecording && (
          <Progress
            value={(currentChunkDuration / CHUNK_DURATION) * 100}
            size="sm"
            colorScheme="red"
            isAnimated
          />
        )}

        {/* Controles de grabación */}
        <Flex justify="center" mt={4}>
          {!isRecording ? (
            <Button
              leftIcon={<FaMicrophone />}
              colorScheme="red"
              onClick={startRecording}
              disabled={isUploading}
            >
              Iniciar Grabación
            </Button>
          ) : (
            <Button
              leftIcon={<FaStop />}
              colorScheme="gray"
              onClick={handleStopButtonClick}
              disabled={isUploading}
            >
              Detener Grabación
            </Button>
          )}
        </Flex>

        {/* Indicador de subida */}
        {isUploading && (
          <HStack spacing={2} justifyContent="center">
            <Text fontSize="sm">Subiendo audio...</Text>
            <Progress size="xs" isIndeterminate width="100px" />
          </HStack>
        )}
      </VStack>

      {/* Diálogo de confirmación para detener */}
      <AlertDialog
        isOpen={showStopConfirm}
        leastDestructiveRef={cancelRef}
        onClose={cancelStopRecording}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Detener Grabación
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro que deseas detener la grabación? Esta acción no se puede deshacer.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelStopRecording}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmStopRecording} ml={3}>
                Detener
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AudioRecorder;
