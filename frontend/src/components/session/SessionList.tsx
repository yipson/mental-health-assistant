import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Input,
  Stack,
  Heading,
  List,
  ListItem,
  Badge
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { Session, SessionStatus } from '../../types';
import useSessionStore from '../../store/sessionStore';
import { sessionsApi } from '../../api/api';

interface SessionListProps {
  onViewSession?: (session: Session) => void;
  onEditSession?: (session: Session) => void;
}

type SortField = 'patientName' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';

const SessionList: React.FC<SessionListProps> = ({ 
  onViewSession, 
  onEditSession 
}) => {
  const { sessions, deleteSession } = useSessionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = async (session: Session) => {
    if (window.confirm(`Are you sure you want to delete the session for ${session.patientName}?`)) {
      try {
        const response = await sessionsApi.deleteSession(session.id);
        
        if (response.success) {
          deleteSession(session.id);
          alert('Session deleted successfully');
        } else {
          throw new Error(response.error || 'Failed to delete session');
        }
      } catch (error) {
        alert(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return <Badge colorScheme="blue">Scheduled</Badge>;
      case SessionStatus.IN_PROGRESS:
        return <Badge colorScheme="orange">In Progress</Badge>;
      case SessionStatus.COMPLETED:
        return <Badge colorScheme="green">Completed</Badge>;
      case SessionStatus.CANCELLED:
        return <Badge colorScheme="red">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filteredSessions = sessions.filter(session => 
    session.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortField === 'patientName') {
      return sortDirection === 'asc' 
        ? a.patientName.localeCompare(b.patientName)
        : b.patientName.localeCompare(a.patientName);
    } else if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortField === 'status') {
      return sortDirection === 'asc' 
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  return (
    <Box>
      <Flex mb={4} justify="space-between" align="center">
        <Input
          placeholder="Search by patient name"
          value={searchTerm}
          onChange={handleSearchChange}
          maxWidth="300px"
        />
        <Stack direction="row">
          <Button onClick={() => handleSort('patientName')}>
            Sort by Name {sortField === 'patientName' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          <Button onClick={() => handleSort('date')}>
            Sort by Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
        </Stack>
      </Flex>

      {sortedSessions.length > 0 ? (
        <List spacing={3}>
          {sortedSessions.map((session) => {
            // Extract status badge to simplify rendering
            const statusBadge = getStatusBadge(session.status);
            
            return (
              <ListItem key={session.id} p={4} borderWidth="1px" borderRadius="md" bg="white">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="md">{session.patientName}</Heading>
                    <Text>{format(new Date(session.date), 'MMM d, yyyy h:mm a')}</Text>
                    <Text>{session.duration} minutes</Text>
                    {statusBadge}
                  </Box>
                  <Stack direction="row">
                    <Button 
                      colorScheme="blue" 
                      onClick={() => onViewSession && onViewSession(session)}
                    >
                      View
                    </Button>
                    <Button 
                      colorScheme="teal" 
                      onClick={() => onEditSession && onEditSession(session)}
                    >
                      Edit
                    </Button>
                    <Button 
                      colorScheme="red" 
                      onClick={() => handleDeleteClick(session)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Flex>
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Box p={8} textAlign="center">
          <Text color="gray.500">No sessions found</Text>
        </Box>
      )}
    </Box>
  );
};

export default SessionList;
