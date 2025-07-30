import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  query, 
  where, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase.config.js';
import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_CATEGORIES, 
  DEFAULT_NOTIFICATION_PREFERENCES 
} from '../constants/notifications.js';
import emailService from './emailService.js';

class NotificationService {
  constructor() {
    this.collection = collection(db, 'notifications');
  }

  /**
   * Create a new notification
   * @param {string} userId - User ID to send notification to
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(userId, notificationData) {
    try {
      const notification = {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || NOTIFICATION_TYPES.INFO,
        category: notificationData.category || NOTIFICATION_CATEGORIES.GENERAL,
        isRead: false,
        data: notificationData.data || {},
        createdAt: Timestamp.now(),
        readAt: null
      };

      const docRef = await addDoc(this.collection, notification);
      console.log(`📬 Notification created for user ${userId}: ${notification.title}`);
      
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications with pagination info
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20,
        unreadOnly = false,
        category = ''
      } = options;

      // Simple query to avoid composite index issues
      const q = query(this.collection, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      let notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
      }));

      // Client-side filtering
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.isRead);
      }

      if (category) {
        notifications = notifications.filter(n => n.category === category);
      }

      // Sort by creation date (most recent first)
      notifications.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      // Client-side pagination
      const totalNotifications = notifications.length;
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedNotifications = notifications.slice(startIndex, endIndex);

      // Calculate unread count
      const unreadCount = notifications.filter(n => !n.isRead).length;

      return {
        notifications: paginatedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / parseInt(limit)),
          totalNotifications,
          hasNextPage: endIndex < totalNotifications,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId, userId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const notificationData = notificationDoc.data();

      // Check authorization
      if (notificationData.userId !== userId) {
        throw new Error('Not authorized');
      }

      await updateDoc(notificationRef, {
        isRead: true,
        readAt: Timestamp.now()
      });

      console.log(`📖 Notification ${notificationId} marked as read by user ${userId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead(userId) {
    try {
      const q = query(
        this.collection,
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(docSnapshot => {
        const notificationRef = doc(db, 'notifications', docSnapshot.id);
        return updateDoc(notificationRef, {
          isRead: true,
          readAt: Timestamp.now()
        });
      });

      await Promise.all(updatePromises);
      console.log(`📖 ${snapshot.docs.length} notifications marked as read for user ${userId}`);
      
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const notificationData = notificationDoc.data();

      // Check authorization
      if (notificationData.userId !== userId) {
        throw new Error('Not authorized');
      }

      await deleteDoc(notificationRef);
      console.log(`🗑️ Notification ${notificationId} deleted by user ${userId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  async createBulkNotifications(userIds, notificationData) {
    try {
      const promises = userIds.map(userId => 
        this.createNotification(userId, notificationData)
      );
      
      const results = await Promise.all(promises);
      console.log(`📬 Bulk notification sent to ${userIds.length} users: ${notificationData.title}`);
      
      return results;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User notification preferences
   */
  async getUserPreferences(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      return userData.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<void>}
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        notificationPreferences: preferences,
        updatedAt: Timestamp.now()
      });

      console.log(`⚙️ Notification preferences updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Send notification with email if user preferences allow
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @param {Object} emailData - Email template data
   * @param {string} templateType - Email template type
   * @returns {Promise<Object>} Created notification
   */
  async sendNotificationWithEmail(userId, notificationData, emailData = null, templateType = null) {
    try {
      // Create in-app notification
      const notification = await this.createNotification(userId, notificationData);

      // Send email if email data is provided
      if (emailData && templateType) {
        try {
          await emailService.sendEmail(
            emailData.email,
            emailData.subject,
            emailData.templateData,
            templateType
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification with email:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new NotificationService();
