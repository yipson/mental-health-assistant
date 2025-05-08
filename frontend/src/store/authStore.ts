import { create } from 'zustand';
import authService, { AuthResponse, LoginCredentials, RegisterData } from '../api/authService';

interface AuthState {
  user: AuthResponse | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: authService.getCurrentUser(),
  isLoading: false,
  error: null,
  
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(credentials);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to login. Please check your credentials.'
      });
    }
  },
  
  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      });
    }
  },
  
  logout: () => {
    authService.logout();
    set({ user: null });
  },
  
  clearError: () => set({ error: null })
}));

export default useAuthStore;
