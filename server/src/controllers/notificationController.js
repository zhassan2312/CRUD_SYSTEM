import notificationService from '../services/notificationService.js';
import emailService from '../services/emailService.js';
import { EMAIL_TEMPLATE_TYPES } from '../constants/notifications.js';
import { 
  sendSuccess, 
  sendError, 
  sendNotFound, 
  sendForbidden, 
  asyncHandler 
} from '../utils/responseHelpers.js';

// Create notification
export const createNotification = async (userId, notificationData) => {
  return await notificationService.createNotification(userId, notificationData);
};

// Get user notifications
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { 
    page = 1, 
    limit = 20,
    unreadOnly = false,
    category = ''
  } = req.query;

  const result = await notificationService.getUserNotifications(userId, {
    page,
    limit,
    unreadOnly: unreadOnly === 'true',
    category
  });

  sendSuccess(res, result, "Notifications retrieved successfully");
});

// Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.uid;

  try {
    await notificationService.markAsRead(notificationId, userId);
    sendSuccess(res, null, "Notification marked as read");
  } catch (error) {
    if (error.message === 'Notification not found') {
      return sendNotFound(res, 'Notification');
    }
    if (error.message === 'Not authorized') {
      return sendForbidden(res);
    }
    throw error;
  }
});

// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  
  const count = await notificationService.markAllAsRead(userId);
  
  sendSuccess(res, { count }, `${count} notifications marked as read`);
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.uid;

  try {
    await notificationService.deleteNotification(notificationId, userId);
    sendSuccess(res, null, "Notification deleted successfully");
  } catch (error) {
    if (error.message === 'Notification not found') {
      return sendNotFound(res, 'Notification');
    }
    if (error.message === 'Not authorized') {
      return sendForbidden(res);
    }
    throw error;
  }
});

// Get notification preferences
export const getNotificationPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  
  try {
    const preferences = await notificationService.getUserPreferences(userId);
    sendSuccess(res, { preferences }, "Notification preferences retrieved successfully");
  } catch (error) {
    if (error.message === 'User not found') {
      return sendNotFound(res, 'User');
    }
    throw error;
  }
});

// Update notification preferences
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { preferences } = req.body;

  await notificationService.updateUserPreferences(userId, preferences);
  
  sendSuccess(res, { preferences }, "Notification preferences updated successfully");
});

// Send email notification (updated to use new service)
export const sendEmailNotification = async (email, subject, templateData, templateType = EMAIL_TEMPLATE_TYPES.GENERAL) => {
  return await emailService.sendEmail(email, subject, templateData, templateType);
};

// Helper function to create notification for multiple users
export const createBulkNotifications = async (userIds, notificationData) => {
  return await notificationService.createBulkNotifications(userIds, notificationData);
};

// Send notification with email (new function)
export const sendNotificationWithEmail = async (userId, notificationData, emailData = null, templateType = null) => {
  return await notificationService.sendNotificationWithEmail(userId, notificationData, emailData, templateType);
};
