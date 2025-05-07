import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformDisplayProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  audioUrl,
  height = 80,
  waveColor = 'rgba(0, 134, 230, 0.4)',
  progressColor = 'rgba(0, 134, 230, 1)'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      height: height,
      cursorWidth: 1,
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      // Remove unsupported 'responsive' property
      normalize: true,
    });

    // Load audio
    wavesurfer.load(audioUrl);

    // Set up event listeners
    wavesurfer.on('ready', () => {
      wavesurferRef.current = wavesurfer;
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    // Clean up on unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl, height, waveColor, progressColor]);

  const handleClick = () => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
  };

  return (
    <Box 
      ref={containerRef} 
      onClick={handleClick} 
      cursor="pointer" 
      borderRadius="md"
      p={2}
      bg="gray.50"
      _hover={{ bg: 'gray.100' }}
      transition="background 0.2s"
    />
  );
};

export default WaveformDisplay;
