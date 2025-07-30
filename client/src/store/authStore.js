import { create } from 'zustand';
import api from '../lib/api';
import { toast } from 'react-toastify';

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // Check authentication status
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // For now, just check if we have a cookie/token by making any authenticated request
      // You can create a specific /auth/me endpoint later if needed
      const response = await api.get('/projects');
      // If the request succeeds, we're authenticated but we need user info
      // For simplicity, we'll store minimal user info in localStorage during login
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        set({ 
          user: JSON.parse(storedUser), 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (error) {
      localStorage.removeItem('user');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  // Register user
  register: async (userData) => {
    try {
      set({ isLoading: true });
      const formData = new FormData();
      
      Object.keys(userData).forEach(key => {
        if (key === 'profilePic' && userData[key]) {
          formData.append('profilePic', userData[key]);
        } else {
          formData.append(key, userData[key]);
        }
      });

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set({ 
        user: response.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      // Store user info in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/login', credentials);
      
      set({ 
        user: response.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      // Store user info in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('user');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
      toast.success('Logged out successfully!');
    } catch (error) {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('user');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
      console.error('Logout error:', error);
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      set({ isLoading: true });
      await api.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      toast.success('Password reset link sent to your email!');
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to send reset link';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      set({ isLoading: true });
      await api.post('/auth/reset-password', { token, newPassword });
      set({ isLoading: false });
      toast.success('Password reset successfully!');
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Clear any errors (utility function)
  clearError: () => set({ error: null })
}));
