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
  orderBy,
  limit
} from 'firebase/firestore';
import { db, mail } from '../config/firebase.config.js';

// Create notification
export const createNotification = async (userId, notificationData) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const notification = {
      userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info', // info, success, warning, error
      category: notificationData.category || 'general', // general, project, system, admin
      isRead: false,
      data: notificationData.data || {}, // Additional data (projectId, etc.)
      createdAt: new Date().toISOString(),
      readAt: null
    };

    const docRef = await addDoc(notificationsRef, notification);
    return { id: docRef.id, ...notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit: pageLimit = 20,
      unreadOnly = false,
      category = ''
    } = req.query;

    const notificationsRef = collection(db, 'notifications');
    let queries = [where('userId', '==', userId)];

    // Filter by read status
    if (unreadOnly === 'true') {
      queries.push(where('isRead', '==', false));
    }

    // Filter by category
    if (category) {
      queries.push(where('category', '==', category));
    }

    // Add ordering and limit
    queries.push(orderBy('createdAt', 'desc'));
    
    const q = query(notificationsRef, ...queries);
    const snapshot = await getDocs(q);
    
    let notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side pagination (for simplicity)
    const totalNotifications = notifications.length;
    const startIndex = (parseInt(page) - 1) * parseInt(pageLimit);
    const endIndex = startIndex + parseInt(pageLimit);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: {
        notifications: paginatedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / parseInt(pageLimit)),
          totalNotifications,
          hasNextPage: endIndex < totalNotifications,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(pageLimit)
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const notificationData = notificationDoc.data();

    // Check if notification belongs to user
    if (notificationData.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update notification
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: new Date().toISOString()
    });

    res.status(200).json({ message: "Notification marked as read" });

  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(docSnapshot => {
      const notificationRef = doc(db, 'notifications', docSnapshot.id);
      return updateDoc(notificationRef, {
        isRead: true,
        readAt: new Date().toISOString()
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({ 
      message: "All notifications marked as read",
      count: snapshot.docs.length
    });

  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const notificationData = notificationDoc.data();

    // Check if notification belongs to user
    if (notificationData.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await deleteDoc(notificationRef);

    res.status(200).json({ message: "Notification deleted successfully" });

  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const preferences = userData.notificationPreferences || {
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

    res.status(200).json({
      message: "Notification preferences retrieved successfully",
      preferences
    });

  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      notificationPreferences: preferences,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      message: "Notification preferences updated successfully",
      preferences
    });

  } catch (error) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send email notification
export const sendEmailNotification = async (email, subject, templateData, templateType = 'general') => {
  try {
    const emailData = {
      to: [email],
      message: {
        subject,
        html: generateEmailTemplate(templateType, templateData)
      },
      createdAt: new Date().toISOString()
    };

    await addDoc(mail, emailData);
    console.log(`Email notification queued for ${email}`);

  } catch (error) {
    console.error("Error sending email notification:", error);
    throw error;
  }
};

// Generate email templates
const generateEmailTemplate = (templateType, data) => {
  const baseStyle = `
    font-family: Arial, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    max-width: 600px; 
    margin: 0 auto; 
    padding: 20px;
  `;

  switch (templateType) {
    case 'project-status-change':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Project Status Update</title>
        </head>
        <body style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2196f3; margin-bottom: 10px;">Project Status Update</h1>
            <p style="color: #666; font-size: 16px;">Your project status has been updated</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.userName}!</h2>
            <p style="margin-bottom: 20px;">
              Your project "<strong>${data.projectTitle}</strong>" status has been changed to 
              <strong style="color: ${getStatusColor(data.newStatus)}">${data.newStatus.toUpperCase()}</strong>.
            </p>
            
            ${data.reviewerComment ? `
              <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Reviewer Comment:</h4>
                <p style="margin: 0; font-style: italic;">"${data.reviewerComment}"</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.projectUrl}" 
                 style="background-color: #2196f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                View Project Details
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This email was sent from the Project Management System.
            </p>
          </div>
        </body>
        </html>
      `;

    case 'new-assignment':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Project Assignment</title>
        </head>
        <body style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4caf50; margin-bottom: 10px;">New Project Assignment</h1>
            <p style="color: #666; font-size: 16px;">You have been assigned to supervise a new project</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.supervisorName}!</h2>
            <p style="margin-bottom: 20px;">
              You have been assigned as supervisor for the project "<strong>${data.projectTitle}</strong>".
            </p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Project Details:</h4>
              <p><strong>Title:</strong> ${data.projectTitle}</p>
              <p><strong>Students:</strong> ${data.teamMembers}</p>
              <p><strong>Submitted:</strong> ${data.submissionDate}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.projectUrl}" 
                 style="background-color: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Review Project
              </a>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'system-announcement':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>System Announcement</title>
        </head>
        <body style="${baseStyle}">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff9800; margin-bottom: 10px;">System Announcement</h1>
            <p style="color: #666; font-size: 16px;">${data.subject}</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.userName}!</h2>
            <div style="margin-bottom: 20px;">
              ${data.message}
            </div>
            
            ${data.actionUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.actionUrl}" 
                   style="background-color: #ff9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                  ${data.actionText || 'Learn More'}
                </a>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${data.subject || 'Notification'}</title>
        </head>
        <body style="${baseStyle}">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Hello ${data.userName || 'User'}!</h2>
            <div style="margin-bottom: 20px;">
              ${data.message || 'You have a new notification from the Project Management System.'}
            </div>
          </div>
        </body>
        </html>
      `;
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return '#4caf50';
    case 'rejected': return '#f44336';
    case 'under-review': return '#ff9800';
    case 'revision-required': return '#2196f3';
    default: return '#666';
  }
};

// Helper function to create notification for multiple users
export const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const promises = userIds.map(userId => 
      createNotification(userId, notificationData)
    );
    
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};
