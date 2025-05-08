import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const user = authService.getCurrentUser();
    if (user && user.token && config.headers) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear user data and redirect to login
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
