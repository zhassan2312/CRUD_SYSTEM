import { create } from 'zustand';
import api from '../lib/api';
import { toast } from 'react-toastify';

export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  },
  preferences: {
    email: {
      projectStatusChange: true,
      newProjectAssignment: true,
      systemAnnouncements: true,
      weeklyDigest: false
    },
    inApp: {
      projectStatusChange: true,
      newProjectAssignment: true,
      systemAnnouncements: true,
      comments: true
    },
    push: {
      enabled: false,
      projectStatusChange: false,
      urgentOnly: true
    }
  },
  isLoading: false,
  isLoadingPreferences: false,

  // Actions
  getNotifications: async (page = 1, unreadOnly = false, category = '') => {
    try {
      set({ isLoading: true });
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: get().pagination.limit.toString()
      });
      
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (category) params.append('category', category);

      const response = await api.get(`/notifications?${params.toString()}`);
      
      set({
        notifications: response.data.data.notifications,
        pagination: response.data.data.pagination,
        unreadCount: response.data.data.unreadCount,
        isLoading: false
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to load notifications';
      console.error('Get notifications error:', message);
      return { success: false, error: message };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark notification as read';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0
      }));

      toast.success(`${response.data.count} notifications marked as read`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark all notifications as read';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Update local state
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.isRead;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });

      toast.success('Notification deleted');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete notification';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      set({ isLoadingPreferences: true });
      
      const response = await api.get('/notifications/preferences');
      
      set({
        preferences: response.data.preferences,
        isLoadingPreferences: false
      });

      return { success: true, preferences: response.data.preferences };
    } catch (error) {
      set({ isLoadingPreferences: false });
      const message = error.response?.data?.message || 'Failed to load preferences';
      console.error('Get preferences error:', message);
      return { success: false, error: message };
    }
  },

  // Update notification preferences
  updatePreferences: async (newPreferences) => {
    try {
      set({ isLoadingPreferences: true });
      
      const response = await api.put('/notifications/preferences', {
        preferences: newPreferences
      });
      
      set({
        preferences: response.data.preferences,
        isLoadingPreferences: false
      });

      toast.success('Notification preferences updated');
      return { success: true, preferences: response.data.preferences };
    } catch (error) {
      set({ isLoadingPreferences: false });
      const message = error.response?.data?.message || 'Failed to update preferences';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  // Go to specific page
  goToPage: async (page) => {
    await get().getNotifications(page);
  },

  // Filter notifications
  filterNotifications: async (unreadOnly = false, category = '') => {
    await get().getNotifications(1, unreadOnly, category);
  },

  // Add new notification (for real-time updates)
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  // Get notification by ID
  getNotificationById: (id) => {
    const { notifications } = get();
    return notifications.find(notification => notification.id === id);
  },

  // Get notifications by category
  getNotificationsByCategory: (category) => {
    const { notifications } = get();
    return notifications.filter(notification => notification.category === category);
  },

  // Get unread notifications
  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notification => !notification.isRead);
  },

  // Clear all notifications (local state only)
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalNotifications: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20
      }
    });
  },

  // Format notification time
  formatNotificationTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}));
