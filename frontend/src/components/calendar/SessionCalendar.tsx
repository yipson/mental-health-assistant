import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import { Calendar, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Session, CalendarEvent } from '../../types';
import useSessionStore from '../../store/sessionStore';
import SessionForm from '../session/SessionForm';

// Setup the localizer for BigCalendar
const localizer = momentLocalizer(moment);

interface SessionCalendarProps {
  onViewSession?: (session: Session) => void;
}

const SessionCalendar: React.FC<SessionCalendarProps> = ({ onViewSession }) => {
  const toast = useToast();
  const { sessions } = useSessionStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Convert sessions to calendar events
  const events: CalendarEvent[] = sessions.map(session => ({
    id: session.id,
    title: `${session.patientName} - ${session.status}`,
    start: new Date(session.date),
    end: new Date(new Date(session.date).getTime() + session.duration * 60000),
    sessionId: session.id,
    patientName: session.patientName
  }));

  // Handle slot selection (clicking on a time slot)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo.start);
    setSelectedSession(null);
    onOpen();
  }, [onOpen]);

  // Handle event selection (clicking on an existing event)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    const session = sessions.find(s => s.id === event.sessionId);
    if (session && onViewSession) {
      onViewSession(session);
    }
  }, [sessions, onViewSession]);

  // Handle successful session creation
  const handleSessionCreated = (session: Session) => {
    toast({
      title: 'Session scheduled',
      description: `Session for ${session.patientName} has been scheduled`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <Box
      p={1}
      bg="brand.500"
      color="white"
      borderRadius="md"
      fontSize="sm"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
      cursor="pointer"
    >
      {event.title}
    </Box>
  );

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Session Calendar</Heading>
        <Flex>
          <Button
            size="sm"
            mr={2}
            variant={calendarView === 'month' ? 'solid' : 'outline'}
            colorScheme="brand"
            onClick={() => setCalendarView('month')}
          >
            Month
          </Button>
          <Button
            size="sm"
            mr={2}
            variant={calendarView === 'week' ? 'solid' : 'outline'}
            colorScheme="brand"
            onClick={() => setCalendarView('week')}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={calendarView === 'day' ? 'solid' : 'outline'}
            colorScheme="brand"
            onClick={() => setCalendarView('day')}
          >
            Day
          </Button>
        </Flex>
      </Flex>

      <Box 
        height="700px" 
        bg="white" 
        p={4} 
        borderRadius="lg" 
        shadow="md"
        className="session-calendar"
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          view={calendarView}
          onView={(view) => setCalendarView(view as 'month' | 'week' | 'day')}
          components={{
            event: EventComponent
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: 'transparent',
              border: 'none'
            }
          })}
          dayPropGetter={(date) => {
            const today = new Date();
            return {
              style: {
                backgroundColor: 
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear()
                    ? 'rgba(0, 134, 230, 0.05)'
                    : undefined
              }
            };
          }}
        />
      </Box>

      {/* New Session Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedSession ? 'Edit Session' : 'Schedule New Session'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SessionForm
              initialData={
                selectedSession || 
                (selectedSlot ? { date: selectedSlot } : {})
              }
              onSuccess={handleSessionCreated}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SessionCalendar;
