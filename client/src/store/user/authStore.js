import { create } from 'zustand';
import api from '../../lib/api';
import { toast } from 'react-toastify';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // Check authentication status
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // Check if we have user data in localStorage
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
      
      // If there's a profile picture, use FormData, otherwise use JSON
      if (userData.profilePic) {
        const formData = new FormData();
        Object.keys(userData).forEach(key => {
          if (key === 'profilePic' && userData[key]) {
            formData.append('profilePic', userData[key]);
          } else {
            formData.append(key, userData[key]);
          }
        });

        const response = await api.post('/user/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Don't auto-authenticate, user needs to verify email first
        set({ isLoading: false });
        
        toast.success('Registration successful! Please check your email to verify your account.');
        return { success: true, verificationRequired: true };
      } else {
        // Use JSON for registration without profile picture
        const response = await api.post('/user/auth/register', userData);

        // Don't auto-authenticate, user needs to verify email first
        set({ isLoading: false });
        
        toast.success('Registration successful! Please check your email to verify your account.');
        return { success: true, verificationRequired: true };
      }
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
            const response = await api.post('/user/auth/login', { email, password });
      
      set({ 
        user: response.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      // Store user info and token in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      
      // Import notification store to fetch notifications after login
      const { useNotificationStore } = await import('./notificationStore');
      const { getNotifications, checkForNewNotifications } = useNotificationStore.getState();
      
      // Fetch initial notifications
      getNotifications(1, false);
      
      // Check for new notifications (recent ones)
      setTimeout(() => {
        checkForNewNotifications();
      }, 1000);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const errorData = error.response?.data;
      const message = errorData?.message || 'Login failed';
      
      // Handle specific verification error
      if (errorData?.requiresVerification) {
        toast.error(message);
        return { 
          success: false, 
          error: message, 
          requiresVerification: true,
          email: credentials.email 
        };
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/user/auth/logout');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
      toast.success('Logged out successfully!');
    } catch (error) {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('user');
      localStorage.removeItem('token');
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
      await api.post('/user/auth/forgot-password', { email });
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
      await api.post('/user/auth/reset-password', { token, newPassword });
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

  // Verify email
  verifyEmail: async (token) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/user/auth/verify-email', { token });
      set({ isLoading: false });
      toast.success('Email verified successfully! You can now login.');
      return { success: true, message: response.data.message };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/user/auth/resend-verification', { email });
      set({ isLoading: false });
      
      if (response.data.alreadyVerified) {
        toast.info('Email is already verified. You can login now.');
        return { success: true, alreadyVerified: true };
      }
      
      toast.success('Verification email sent! Please check your inbox.');
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Clear any errors (utility function)
  clearError: () => set({ error: null })
}));

export default useAuthStore;