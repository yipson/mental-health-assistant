import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  useColorModeValue,
  FormErrorMessage,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import useAuthStore from '../store/authStore';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, user, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Show error toast when auth error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const validateLoginForm = () => {
    const errors: Record<string, string> = {};
    if (!loginForm.username.trim()) errors.username = 'Username is required';
    if (!loginForm.password) errors.password = 'Password is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};
    
    if (!registerForm.username.trim()) errors.username = 'Username is required';
    if (!registerForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(registerForm.email)) errors.email = 'Email is invalid';
    
    if (!registerForm.password) errors.password = 'Password is required';
    else if (registerForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (!registerForm.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (registerForm.password !== registerForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    if (!registerForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!registerForm.lastName.trim()) errors.lastName = 'Last name is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLoginForm()) {
      await login(loginForm);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegisterForm()) {
      const { confirmPassword, ...registerData } = registerForm;
      await register(registerData);
      
      // Show success message and switch to login
      toast({
        title: 'Registration successful',
        description: 'You can now log in with your credentials',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsRegister(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6} width={'450px'}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            Mental Health Assistant
          </Text>
        </Stack>
        
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          {isRegister ? (
            <form onSubmit={handleRegisterSubmit}>
              <Stack spacing={4}>
                <Flex gap={4}>
                  <FormControl id="firstName" isInvalid={!!validationErrors.firstName}>
                    <FormLabel>First Name</FormLabel>
                    <Input 
                      type="text" 
                      name="firstName"
                      value={registerForm.firstName}
                      onChange={handleRegisterChange}
                    />
                    <FormErrorMessage>{validationErrors.firstName}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl id="lastName" isInvalid={!!validationErrors.lastName}>
                    <FormLabel>Last Name</FormLabel>
                    <Input 
                      type="text" 
                      name="lastName"
                      value={registerForm.lastName}
                      onChange={handleRegisterChange}
                    />
                    <FormErrorMessage>{validationErrors.lastName}</FormErrorMessage>
                  </FormControl>
                </Flex>
                
                <FormControl id="username" isInvalid={!!validationErrors.username}>
                  <FormLabel>Username</FormLabel>
                  <Input 
                    type="text" 
                    name="username"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                  />
                  <FormErrorMessage>{validationErrors.username}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="email" isInvalid={!!validationErrors.email}>
                  <FormLabel>Email address</FormLabel>
                  <Input 
                    type="email" 
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                  />
                  <FormErrorMessage>{validationErrors.email}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="password" isInvalid={!!validationErrors.password}>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={togglePasswordVisibility}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{validationErrors.password}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="confirmPassword" isInvalid={!!validationErrors.confirmPassword}>
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={togglePasswordVisibility}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{validationErrors.confirmPassword}</FormErrorMessage>
                </FormControl>
                
                <Stack spacing={10} pt={2}>
                  <Button
                    loadingText="Submitting"
                    size="lg"
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                    type="submit"
                    isLoading={isLoading}
                  >
                    Register
                  </Button>
                </Stack>
                
                <Stack pt={6}>
                  <Text align={'center'}>
                    Already a user?{' '}
                    <Link color={'blue.400'} onClick={() => setIsRegister(false)}>
                      Login
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit}>
              <Stack spacing={4}>
                <FormControl id="login-username" isInvalid={!!validationErrors.username}>
                  <FormLabel>Username</FormLabel>
                  <Input 
                    type="text" 
                    name="username"
                    value={loginForm.username}
                    onChange={handleLoginChange}
                  />
                  <FormErrorMessage>{validationErrors.username}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="login-password" isInvalid={!!validationErrors.password}>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={togglePasswordVisibility}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{validationErrors.password}</FormErrorMessage>
                </FormControl>
                
                <Stack spacing={10}>
                  <Button
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                    type="submit"
                    isLoading={isLoading}
                  >
                    Sign in
                  </Button>
                </Stack>
                
                <Stack pt={6}>
                  <Text align={'center'}>
                    Don't have an account?{' '}
                    <Link color={'blue.400'} onClick={() => setIsRegister(true)}>
                      Register
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Stack>
    </Flex>
  );
};

export default Login;
