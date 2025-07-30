// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Notification Categories
export const NOTIFICATION_CATEGORIES = {
  GENERAL: 'general',
  PROJECT: 'project',
  SYSTEM: 'system',
  ADMIN: 'admin'
};

// Email Template Types
export const EMAIL_TEMPLATE_TYPES = {
  PROJECT_STATUS_CHANGE: 'project-status-change',
  NEW_ASSIGNMENT: 'new-assignment',
  SYSTEM_ANNOUNCEMENT: 'system-announcement',
  GENERAL: 'general'
};

// Project Status Colors
export const STATUS_COLORS = {
  APPROVED: '#4caf50',
  REJECTED: '#f44336',
  UNDER_REVIEW: '#ff9800',
  REVISION_REQUIRED: '#2196f3',
  DEFAULT: '#666'
};

// Default Notification Preferences
export const DEFAULT_NOTIFICATION_PREFERENCES = {
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
};
