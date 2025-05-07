import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  Button,
  Flex,
  Skeleton,
  useToast,
  Icon
} from '@chakra-ui/react';
import { FaFileAlt, FaFileDownload, FaCopy } from 'react-icons/fa';
import Highlighter from 'react-highlight-words';
import useRecordingStore from '../../store/recordingStore';

interface TranscriptionDisplayProps {
  sessionId: string;
  onRequestSummary?: () => void;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  sessionId,
  onRequestSummary
}) => {
  const toast = useToast();
  const { transcriptionText, isTranscribing } = useRecordingStore();
  const [searchWords, setSearchWords] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleCopyToClipboard = () => {
    if (!transcriptionText) return;
    
    navigator.clipboard.writeText(transcriptionText)
      .then(() => {
        toast({
          title: 'Copied to clipboard',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      })
      .catch((error) => {
        toast({
          title: 'Failed to copy',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleDownload = () => {
    if (!transcriptionText) return;
    
    const element = document.createElement('a');
    const file = new Blob([transcriptionText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${sessionId}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Transcription downloaded',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleRequestSummary = () => {
    if (onRequestSummary) {
      onRequestSummary();
    }
  };

  // This would be expanded in a real application with search functionality
  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchWords([]);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      bg="white"
      shadow="md"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md" display="flex" alignItems="center">
          <FaFileAlt size={20} style={{ marginRight: '8px', color: 'var(--chakra-colors-brand-500)' }} />
          Transcription
        </Heading>
        
        <Flex>
          {transcriptionText && (
            <>
              <Button
                size="sm"
                leftIcon={<FaCopy />}
                mr={2}
                onClick={handleCopyToClipboard}
              >
                Copy
              </Button>
              
              <Button
                size="sm"
                leftIcon={<FaFileDownload />}
                mr={2}
                onClick={handleDownload}
              >
                Download
              </Button>
              
              <Button
                size="sm"
                colorScheme="brand"
                onClick={handleRequestSummary}
              >
                Generate Summary
              </Button>
            </>
          )}
        </Flex>
      </Flex>
      
      {isTranscribing ? (
        <Box>
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} width="75%" />
        </Box>
      ) : transcriptionText ? (
        <Box
          bg="gray.50"
          p={4}
          borderRadius="md"
          maxH="400px"
          overflowY="auto"
          fontSize="md"
          lineHeight="tall"
        >
          {searchWords.length > 0 ? (
            <Highlighter
              searchWords={searchWords}
              textToHighlight={transcriptionText}
              highlightStyle={{ backgroundColor: 'yellow', padding: '0' }}
            />
          ) : (
            transcriptionText.split('\n').map((paragraph, index) => (
              <Text key={index} mb={2}>
                {paragraph}
              </Text>
            ))
          )}
        </Box>
      ) : (
        <Box
          bg="gray.50"
          p={4}
          borderRadius="md"
          textAlign="center"
          color="gray.500"
        >
          <Text>No transcription available yet.</Text>
          <Text fontSize="sm" mt={2}>
            Record a session and transcribe it to see the text here.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TranscriptionDisplay;
