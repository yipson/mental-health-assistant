import React from 'react';
import {
  Box,
  Text,
  Heading,
  Button,
  Flex,
  Skeleton,
  useToast,
  Icon,
  Tag,
  VStack,
  HStack,
  Divider
} from '@chakra-ui/react';
import { FaFileAlt, FaFileDownload, FaCopy, FaListUl } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import useRecordingStore from '../../store/recordingStore';

interface SummaryDisplayProps {
  sessionId: string;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ sessionId }) => {
  const toast = useToast();
  const { summary, isSummarizing } = useRecordingStore();

  const handleCopyToClipboard = () => {
    if (!summary) return;
    
    navigator.clipboard.writeText(summary)
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
    if (!summary) return;
    
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `summary-${sessionId}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Summary downloaded',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Mock function to extract key points from the summary
  // In a real application, these would come from the backend
  const extractKeyPoints = (summaryText: string): string[] => {
    // This is a simplified example - in a real app, you'd have more sophisticated parsing
    const lines = summaryText.split('\n');
    const keyPoints: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        keyPoints.push(line.substring(2));
      }
    }
    
    return keyPoints.length > 0 ? keyPoints : ['No key points identified'];
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
          <FaFileAlt size={20} style={{ marginRight: '8px', color: 'var(--chakra-colors-accent-500)' }} />
          AI Summary
        </Heading>
        
        <Flex>
          {summary && (
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
                onClick={handleDownload}
              >
                Download
              </Button>
            </>
          )}
        </Flex>
      </Flex>
      
      {isSummarizing ? (
        <Box>
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} />
          <Skeleton height="20px" my={2} width="75%" />
        </Box>
      ) : summary ? (
        <VStack align="stretch" spacing={4}>
          <Box>
            <Flex align="center" mb={2}>
              <FaListUl size={20} style={{ marginRight: '8px', color: 'var(--chakra-colors-accent-500)' }} />
              <Text fontWeight="bold">Key Points</Text>
            </Flex>
            <Box
              bg="gray.50"
              p={3}
              borderRadius="md"
              fontSize="sm"
            >
              <HStack spacing={2} flexWrap="wrap">
                {extractKeyPoints(summary).map((point, index) => (
                  <Tag key={index} colorScheme="accent" my={1}>
                    {point}
                  </Tag>
                ))}
              </HStack>
            </Box>
          </Box>
          
          <Divider />
          
          <Box>
            <Text fontWeight="bold" mb={2}>Full Summary</Text>
            <Box
              bg="gray.50"
              p={4}
              borderRadius="md"
              maxH="300px"
              overflowY="auto"
              fontSize="md"
              lineHeight="tall"
              className="markdown-content"
            >
              <ReactMarkdown>{summary}</ReactMarkdown>
            </Box>
          </Box>
        </VStack>
      ) : (
        <Box
          bg="gray.50"
          p={4}
          borderRadius="md"
          textAlign="center"
          color="gray.500"
        >
          <Text>No summary available yet.</Text>
          <Text fontSize="sm" mt={2}>
            Generate a summary from the transcription to see it here.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SummaryDisplay;
