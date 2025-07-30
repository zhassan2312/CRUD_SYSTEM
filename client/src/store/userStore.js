import { create } from 'zustand';
import api from '../lib/api';
import { toast } from 'react-toastify';

export const useUserStore = create((set, get) => ({
  userProfile: null,
  userStats: null,
  userPreferences: null,
  isLoading: false,
  error: null,

  // Get current user profile
  getUserProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get('/users/profile');
      
      set({ 
        userProfile: response.data.user,
        isLoading: false 
      });
      
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch profile';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    try {
      set({ isLoading: true, error: null });
      
      // If there's a profile picture, use FormData
      let requestData = profileData;
      let headers = {};
      
      if (profileData.profilePicture instanceof File) {
        const formData = new FormData();
        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== undefined && profileData[key] !== null) {
            formData.append(key, profileData[key]);
          }
        });
        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
      }
      
      const response = await api.put('/users/profile', requestData, { headers });
      
      set({ 
        userProfile: response.data.user,
        isLoading: false 
      });
      
      toast.success('Profile updated successfully!');
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      set({ isLoading: true, error: null });
      
      await api.put('/users/change-password', passwordData);
      
      set({ isLoading: false });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Update user preferences
  updateUserPreferences: async (preferences) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.put('/users/preferences', preferences);
      
      set({ 
        userPreferences: response.data.preferences,
        isLoading: false 
      });
      
      toast.success('Preferences updated successfully!');
      return { success: true, preferences: response.data.preferences };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update preferences';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Delete user account
  deleteUserAccount: async (deleteData) => {
    try {
      set({ isLoading: true, error: null });
      
      await api.delete('/users/delete-account', { data: deleteData });
      
      set({ 
        userProfile: null,
        userStats: null,
        userPreferences: null,
        isLoading: false 
      });
      
      toast.success('Account deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get('/users/stats');
      
      set({ 
        userStats: response.data.stats,
        isLoading: false 
      });
      
      return { success: true, stats: response.data.stats };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user statistics';
      set({ 
        isLoading: false, 
        error: message 
      });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear user data (for logout)
  clearUserData: () => set({
    userProfile: null,
    userStats: null,
    userPreferences: null,
    error: null
  })
}));
