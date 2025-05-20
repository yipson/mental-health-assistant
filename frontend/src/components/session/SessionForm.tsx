import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
  Textarea,
  FormErrorMessage,
  useToast
} from '@chakra-ui/react';
import { useForm, Controller, FieldError } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Session, SessionStatus } from '../../types';
import useSessionStore from '../../store/sessionStore';
import { sessionsApi } from '../../api/api';

// Type definitions
interface SessionFormProps {
  initialData?: Partial<Session>;
  onSuccess?: (session: Session) => void;
}

interface FormValues {
  patientName: string;
  date: Date;
  duration: number;
  status: SessionStatus;
  notes?: string;
}

// Helper components
type FormFieldErrorProps = {
  error?: FieldError | undefined;
};

// This component should only be used inside a FormControl component
const FormFieldError: React.FC<FormFieldErrorProps> = ({ error }) => {
  if (!error) return null;
  
  const errorMessage = typeof error.message === 'string' 
    ? error.message 
    : 'Invalid field';
  
  // FormErrorMessage must be used within a FormControl component to access the FormControl context
  return (
    <FormControl isInvalid={!!error}>
      <FormErrorMessage>{errorMessage}</FormErrorMessage>
    </FormControl>
  );
};

// Main component
const SessionForm: React.FC<SessionFormProps> = ({ 
  initialData = {}, 
  onSuccess 
}) => {
  const toast = useToast();
  const { addSession, updateSession } = useSessionStore();
  
  // Form setup with React Hook Form
  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors, isSubmitting } 
  } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: {
      patientName: initialData.patientName || '',
      date: initialData.date ? new Date(initialData.date) : new Date(),
      duration: initialData.duration || 60,
      status: initialData.status || SessionStatus.SCHEDULED,
      notes: initialData.notes || ''
    }
  });

  // Form submission handler
  const onSubmit = async (data: FormValues): Promise<void> => {
    try {
      if (initialData.id) {
        await handleUpdateSession(initialData.id, data);
      } else {
        await handleCreateSession(data);
      }
    } catch (error) {
      handleError(error);
    }
  };

  // Session update handler
  const handleUpdateSession = async (id: string, data: FormValues): Promise<void> => {
    const response = await sessionsApi.updateSession(id, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update session');
    }
    
    updateSession(id, response.data);
    
    toast({
      title: 'Session updated',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    onSuccess?.(response.data);
  };

  // Session creation handler
  const handleCreateSession = async (data: FormValues): Promise<void> => {
    const response = await sessionsApi.createSession(data as Omit<Session, 'id'>);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create session');
    }
    
    addSession(response.data);
    
    toast({
      title: 'Session created',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    onSuccess?.(response.data);
  };

  // Error handler
  const handleError = (error: unknown): void => {
    toast({
      title: initialData.id ? 'Failed to update session' : 'Failed to create session',
      description: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="md"
      bg="white"
    >
      <VStack spacing={4} align="stretch">
        {/* Patient Name Field */}
        <FormControl isInvalid={!!errors.patientName} isRequired>
          <FormLabel htmlFor="patientName">Patient Name</FormLabel>
          <Input
            id="patientName"
            placeholder="Enter patient name"
            {...register('patientName', {
              required: 'Patient name is required',
              minLength: { value: 2, message: 'Minimum length should be 2 characters' }
            })}
          />
          <FormFieldError error={errors.patientName} />
        </FormControl>

        <HStack spacing={4}>
          {/* Date & Time Field */}
          <FormControl isInvalid={!!errors.date} isRequired>
            <FormLabel htmlFor="date">Date & Time</FormLabel>
            <Controller
              control={control}
              name="date"
              rules={{ required: 'Date is required' }}
              render={({ field }) => {
                // Adjust displayed date to show correct time
                const displayDate = field.value ? new Date(field.value) : null;
                
                return (
                  <DatePicker
                    id="date"
                    selected={displayDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        // Adjust for timezone difference (5 hours)
                        // Create a new date with the same local time values
                        const adjustedDate = new Date(date);
                        // No need to adjust hours - keep the time exactly as selected
                        field.onChange(adjustedDate);
                      } else {
                        field.onChange(new Date());
                      }
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="chakra-input css-1kp110w"
                    wrapperClassName="w-full"
                  />
                );
              }}
            />
            <FormFieldError error={errors.date} />
          </FormControl>

          {/* Duration Field */}
          <FormControl isInvalid={!!errors.duration} isRequired>
            <FormLabel htmlFor="duration">Duration (minutes)</FormLabel>
            <Input
              id="duration"
              type="number"
              placeholder="60"
              {...register('duration', {
                required: 'Duration is required',
                valueAsNumber: true,
                min: { value: 15, message: 'Minimum duration is 15 minutes' },
                max: { value: 180, message: 'Maximum duration is 180 minutes' }
              })}
            />
            <FormFieldError error={errors.duration} />
          </FormControl>
        </HStack>

        {/* Status Field */}
        <FormControl isInvalid={!!errors.status} isRequired>
          <FormLabel htmlFor="status">Status</FormLabel>
          <Select
            id="status"
            {...register('status', {
              required: 'Status is required'
            })}
          >
            <option value={SessionStatus.SCHEDULED}>Scheduled</option>
            <option value={SessionStatus.IN_PROGRESS}>In Progress</option>
            <option value={SessionStatus.COMPLETED}>Completed</option>
            <option value={SessionStatus.CANCELLED}>Cancelled</option>
          </Select>
          <FormFieldError error={errors.status} />
        </FormControl>

        {/* Notes Field */}
        <FormControl isInvalid={!!errors.notes}>
          <FormLabel htmlFor="notes">Notes</FormLabel>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Enter any notes about this session"
            rows={4}
          />
          <FormFieldError error={errors.notes} />
        </FormControl>

        {/* Submit Button */}
        <Button
          mt={4}
          colorScheme="brand"
          isLoading={isSubmitting}
          type="submit"
        >
          {initialData.id ? 'Update Session' : 'Create Session'}
        </Button>
      </VStack>
    </Box>
  );
};

export default SessionForm;
