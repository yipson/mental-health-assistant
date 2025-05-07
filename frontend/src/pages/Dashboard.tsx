import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Button,
  Icon,
  useToast
} from '@chakra-ui/react';
import { FaCalendarAlt, FaUserAlt, FaChartLine, FaMicrophone } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useSessionStore from '../store/sessionStore';
import { sessionsApi } from '../api/api';
import { Session, SessionStatus } from '../types';
import SessionList from '../components/session/SessionList';

const Dashboard: React.FC = () => {
  const toast = useToast();
  const { sessions, setSessions, setLoading, isLoading } = useSessionStore();
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await sessionsApi.getAllSessions();
        
        if (response.success && response.data) {
          setSessions(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch sessions');
        }
      } catch (error) {
        toast({
          title: 'Error fetching sessions',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [setSessions, setLoading, toast]);

  useEffect(() => {
    // Get the 5 most recent sessions
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setRecentSessions(sorted.slice(0, 5));
  }, [sessions]);

  // Calculate dashboard statistics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === SessionStatus.COMPLETED).length;
  const upcomingSessions = sessions.filter(s => s.status === SessionStatus.SCHEDULED).length;
  const inProgressSessions = sessions.filter(s => s.status === SessionStatus.IN_PROGRESS).length;

  // Calculate completion rate
  const completionRate = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;

  // Mock previous period data for comparison
  const previousPeriodSessions = totalSessions - 3;
  const sessionGrowth = previousPeriodSessions > 0 
    ? ((totalSessions - previousPeriodSessions) / previousPeriodSessions) * 100 
    : 100;

  const handleViewSession = (session: Session) => {
    // In a real app, this would navigate to the session view
    console.log('View session:', session);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Dashboard</Heading>
        <Button
          as={Link}
          to="/sessions/new"
          colorScheme="brand"
          leftIcon={<FaMicrophone />}
        >
          New Session
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardHeader pb={0}>
            <Flex align="center">
              <FaCalendarAlt color="brand.500" size={20} style={{ marginRight: '8px' }} />
              <Text fontWeight="medium">Total Sessions</Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatNumber fontSize="3xl">{totalSessions}</StatNumber>
              <StatHelpText>
                <StatArrow type={sessionGrowth >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(Math.round(sessionGrowth))}% from last month
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardHeader pb={0}>
            <Flex align="center">
              <FaUserAlt color="green.500" size={20} style={{ marginRight: '8px' }} />
              <Text fontWeight="medium">Completed</Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatNumber fontSize="3xl">{completedSessions}</StatNumber>
              <StatHelpText>
                {completionRate}% completion rate
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardHeader pb={0}>
            <Flex align="center">
              <Text fontSize="xl" mr={2}>📅</Text>
              <Text fontWeight="medium">Upcoming</Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatNumber fontSize="3xl">{upcomingSessions}</StatNumber>
              <StatHelpText>
                Scheduled sessions
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardHeader pb={0}>
            <Flex align="center">
              <Text fontSize="xl" mr={2}>📈</Text>
              <Text fontWeight="medium">In Progress</Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatNumber fontSize="3xl">{inProgressSessions}</StatNumber>
              <StatHelpText>
                Active sessions
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '1fr' }} gap={6}>
        <GridItem>
          <Box bg="white" p={6} borderRadius="lg" shadow="md">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Recent Sessions</Heading>
              <Button
                as={Link}
                to="/sessions"
                size="sm"
                variant="outline"
                colorScheme="brand"
              >
                View All
              </Button>
            </Flex>
            <SessionList 
              onViewSession={handleViewSession} 
            />
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default Dashboard;
