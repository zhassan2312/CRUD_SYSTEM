import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from '../../config/firebase.config.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { createNotification, sendEmailNotification } from '../user/notificationController.js';

// Initialize Firebase Storage
const firebaseStorage = getStorage();

// Get all projects (Admin only)
export const getAllProjects = async (req, res) => {
  try {
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    const projects = [];
    
    // Get all teachers for reference
    const teachersRef = collection(db, 'teachers');
    const teachersSnapshot = await getDocs(teachersRef);
    const teachersMap = {};
    
    teachersSnapshot.forEach((doc) => {
      teachersMap[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    // Get all users for student names
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const usersMap = {};
    
    usersSnapshot.forEach((doc) => {
      usersMap[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    snapshot.forEach((doc) => {
      const projectData = doc.data();
      
      // Populate supervisor and co-supervisor details
      const supervisor = teachersMap[projectData.supervisorId];
      const coSupervisor = projectData.coSupervisorId ? teachersMap[projectData.coSupervisorId] : null;
      
      // Get student name from user who created the project
      const student = usersMap[projectData.createdBy];
      
      projects.push({
        id: doc.id,
        ...projectData,
        studentName: student ? student.name : 'Unknown Student',
        studentEmail: student ? student.email : '',
        supervisor: supervisor ? {
          id: supervisor.id,
          name: supervisor.name,
          email: supervisor.email
        } : null,
        coSupervisor: coSupervisor ? {
          id: coSupervisor.id,
          name: coSupervisor.name,
          email: coSupervisor.email
        } : null
      });
    });

    // Sort by createdAt on the client side
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      message: "All projects retrieved successfully",
      projects
    });

  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update project status (Admin only)
export const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, reviewComment, sendEmail } = req.body;
    const reviewerId = req.user.id;
    const reviewerName = req.user.fullName || req.user.name || 'Admin';

    // Validate status
    const validStatuses = ['pending', 'under-review', 'approved', 'rejected', 'revision-required'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return res.status(404).json({ message: "Project not found" });
    }

    const projectData = projectDoc.data();
    
    // Create status history entry
    const statusEntry = {
      status,
      comment: reviewComment || '',
      reviewedBy: reviewerName,
      reviewerId: reviewerId,
      timestamp: new Date().toISOString()
    };

    // Get existing status history or create new array
    const statusHistory = projectData.statusHistory || [];
    statusHistory.push(statusEntry);

    // Update project with new status and history
    const updateData = {
      status,
      lastReviewedAt: new Date().toISOString(),
      lastReviewedBy: reviewerName,
      statusHistory,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(projectRef, updateData);

    // Create in-app notification for project owner
    try {
      await createNotification(projectData.createdBy, {
        title: `Project ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Status Updated'}`,
        message: `Your project "${projectData.title}" has been ${status.replace('-', ' ')}${reviewComment ? `. Review comment: "${reviewComment}"` : ''}`,
        type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
        category: 'project',
        data: {
          projectId,
          projectTitle: projectData.title,
          oldStatus: projectData.status,
          newStatus: status,
          reviewComment,
          reviewerName,
          actionRequired: status === 'revision-required',
          timestamp: new Date().toISOString()
        }
      });

      // Also send notification to project supervisor if status is approved
      if (status === 'approved' && projectData.supervisorId) {
        await createNotification(projectData.supervisorId, {
          title: 'Project Approved',
          message: `The project "${projectData.title}" you are supervising has been approved by ${reviewerName}`,
          type: 'success',
          category: 'project',
          data: {
            projectId,
            projectTitle: projectData.title,
            status: 'approved',
            reviewerName,
            role: 'supervisor'
          }
        });
      }

      console.log(`📬 Notification sent to project creator for status change: ${status}`);
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    // Send email notification automatically for project approvals/rejections
    if ((status === 'approved' || status === 'rejected') && projectData.createdBy) {
      try {
        await sendStatusChangeEmail({
          projectId,
          projectTitle: projectData.title,
          newStatus: status,
          reviewComment,
          reviewerName,
          creatorId: projectData.createdBy
        });
      } catch (emailError) {
        console.error("Error sending status change email:", emailError);
        // Don't fail the request if email fails
      }
    }

    // Send optional email for other status changes if requested
    if (sendEmail && projectData.createdBy && status !== 'approved' && status !== 'rejected') {
      try {
        await sendStatusChangeEmail({
          projectId,
          projectTitle: projectData.title,
          newStatus: status,
          reviewComment,
          reviewerName,
          creatorId: projectData.createdBy
        });
      } catch (emailError) {
        console.error("Error sending status change email:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({ 
      message: "Project status updated successfully",
      project: {
        id: projectId,
        status,
        statusHistory,
        lastReviewedAt: updateData.lastReviewedAt,
        lastReviewedBy: reviewerName
      }
    });

  } catch (error) {
    console.error("Update project status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Bulk update projects (Admin only)
export const bulkUpdateProjects = async (req, res) => {
  try {
    const { projectIds, action, status, reviewComment } = req.body;
    const reviewerId = req.user.id;
    const reviewerName = req.user.fullName || req.user.name || 'Admin';

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({ message: "Project IDs array is required" });
    }

    if (!action || !['updateStatus', 'delete'].includes(action)) {
      return res.status(400).json({ message: "Valid action is required (updateStatus, delete)" });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const projectId of projectIds) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
          results.failed.push({
            projectId,
            error: "Project not found"
          });
          continue;
        }

        if (action === 'updateStatus') {
          if (!status) {
            results.failed.push({
              projectId,
              error: "Status is required for updateStatus action"
            });
            continue;
          }

          const projectData = projectDoc.data();
          
          // Create status history entry
          const statusEntry = {
            status,
            comment: reviewComment || '',
            reviewedBy: reviewerName,
            reviewerId: reviewerId,
            timestamp: new Date().toISOString()
          };

          const statusHistory = projectData.statusHistory || [];
          statusHistory.push(statusEntry);

          await updateDoc(projectRef, {
            status,
            lastReviewedAt: new Date().toISOString(),
            lastReviewedBy: reviewerName,
            statusHistory,
            updatedAt: new Date().toISOString()
          });

          // Send notification
          try {
            await createNotification(projectData.createdBy, {
              title: `Project ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Status Updated'}`,
              message: `Your project "${projectData.title}" has been ${status.replace('-', ' ')} in bulk update${reviewComment ? `. Comment: "${reviewComment}"` : ''}`,
              type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
              category: 'project',
              data: {
                projectId,
                projectTitle: projectData.title,
                newStatus: status,
                reviewComment,
                reviewerName,
                bulkUpdate: true
              }
            });
          } catch (notificationError) {
            console.error("Error creating notification for bulk update:", notificationError);
          }

          results.successful.push({
            projectId,
            action: 'status_updated',
            newStatus: status
          });

        } else if (action === 'delete') {
          const projectData = projectDoc.data();

          // Delete associated image if exists
          if (projectData.imageUrl) {
            try {
              const imageRef = ref(firebaseStorage, projectData.imageUrl);
              await deleteObject(imageRef);
            } catch (deleteError) {
              console.error("Error deleting project image:", deleteError);
            }
          }

          await deleteDoc(projectRef);

          results.successful.push({
            projectId,
            action: 'deleted'
          });
        }

      } catch (error) {
        results.failed.push({
          projectId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: "Bulk operation completed",
      results,
      summary: {
        total: projectIds.length,
        successful: results.successful.length,
        failed: results.failed.length
      }
    });

  } catch (error) {
    console.error("Bulk update projects error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get file statistics (Admin only)
export const getFileStatistics = async (req, res) => {
  try {
    // Get all projects to analyze file usage
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    let totalFiles = 0;
    let totalFileSize = 0;
    const fileTypes = {};
    const projectsWithFiles = [];
    
    snapshot.forEach((doc) => {
      const projectData = doc.data();
      if (projectData.files && Array.isArray(projectData.files)) {
        const projectFileCount = projectData.files.length;
        let projectFileSize = 0;
        
        projectData.files.forEach(file => {
          totalFiles++;
          const fileSize = file.size || 0;
          totalFileSize += fileSize;
          projectFileSize += fileSize;
          
          // Count file types
          const extension = file.name ? file.name.split('.').pop().toLowerCase() : 'unknown';
          fileTypes[extension] = (fileTypes[extension] || 0) + 1;
        });
        
        if (projectFileCount > 0) {
          projectsWithFiles.push({
            projectId: doc.id,
            projectTitle: projectData.title,
            fileCount: projectFileCount,
            totalSize: projectFileSize
          });
        }
      }
    });
    
    // Convert file size to readable format
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const statistics = {
      overview: {
        totalFiles,
        totalFileSize: formatFileSize(totalFileSize),
        totalFileSizeBytes: totalFileSize,
        projectsWithFiles: projectsWithFiles.length,
        averageFilesPerProject: projectsWithFiles.length > 0 ? (totalFiles / projectsWithFiles.length).toFixed(2) : 0
      },
      fileTypes: Object.entries(fileTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => ({ type, count })),
      topProjectsByFileCount: projectsWithFiles
        .sort((a, b) => b.fileCount - a.fileCount)
        .slice(0, 10),
      topProjectsByFileSize: projectsWithFiles
        .sort((a, b) => b.totalSize - a.totalSize)
        .slice(0, 10)
        .map(project => ({
          ...project,
          totalSize: formatFileSize(project.totalSize)
        }))
    };
    
    res.status(200).json({
      message: "File statistics retrieved successfully",
      statistics
    });
    
  } catch (error) {
    console.error("Get file statistics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to send status change emails
const sendStatusChangeEmail = async ({ projectId, projectTitle, newStatus, reviewComment, reviewerName, creatorId }) => {
  try {
    // Get user email from users collection
    const userRef = doc(db, 'users', creatorId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const userEmail = userData.email;

    // Create email document for Firebase Extension to process
    const emailData = {
      to: [userEmail],
      message: {
        subject: `Project Status Update: ${projectTitle}`,
        html: generateStatusChangeEmailHTML({
          projectTitle,
          newStatus,
          reviewComment,
          reviewerName,
          projectId
        })
      },
      createdAt: new Date().toISOString()
    };

    // Add to mail collection (Firebase Email Extension will process this)
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, emailData);

    console.log(`Status change email queued for project ${projectId} to ${userEmail}`);

  } catch (error) {
    console.error("Error queuing status change email:", error);
    throw error;
  }
};

// Helper function to generate email HTML
const generateStatusChangeEmailHTML = ({ projectTitle, newStatus, reviewComment, reviewerName }) => {
  const statusColors = {
    'approved': '#4caf50',
    'rejected': '#f44336',
    'revision-required': '#ff9800',
    'under-review': '#2196f3',
    'pending': '#9e9e9e'
  };

  const statusMessages = {
    'approved': 'Congratulations! Your project has been approved.',
    'rejected': 'Unfortunately, your project has been rejected.',
    'revision-required': 'Your project requires some revisions before approval.',
    'under-review': 'Your project is currently under review.',
    'pending': 'Your project status has been reset to pending.'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Project Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2196f3; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">
          Project Status Update
        </h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Project: ${projectTitle}</h3>
          <div style="background-color: ${statusColors[newStatus]}; color: white; padding: 10px; border-radius: 3px; text-align: center; margin: 15px 0;">
            <strong>Status: ${newStatus.toUpperCase().replace('-', ' ')}</strong>
          </div>
          <p>${statusMessages[newStatus]}</p>
        </div>

        ${reviewComment ? `
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">Reviewer Comments:</h4>
          <p style="margin-bottom: 0; font-style: italic;">"${reviewComment}"</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>Reviewed by:</strong> ${reviewerName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated notification from the Project Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
