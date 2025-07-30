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
} from '../config/firebase.config.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { createNotification, sendEmailNotification } from './notificationController.js';

// Initialize Firebase Storage
const firebaseStorage = getStorage();

// Upload image to Firebase Storage
const uploadImage = async (file, projectId) => {
  if (!file) return null;
  
  const fileName = `projects/${projectId}/${Date.now()}_${file.originalname}`;
  const storageRef = ref(firebaseStorage, fileName);
  
  const snapshot = await uploadBytes(storageRef, file.buffer, {
    contentType: file.mimetype
  });
  
  return await getDownloadURL(snapshot.ref);
};

// Get all projects for current user
export const getAllProjectsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef, 
      where('createdBy', '==', userId)
    );
    
    const snapshot = await getDocs(q);
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
    
    snapshot.forEach((doc) => {
      const projectData = doc.data();
      
      // Populate supervisor and co-supervisor details
      const supervisor = teachersMap[projectData.supervisorId];
      const coSupervisor = projectData.coSupervisorId ? teachersMap[projectData.coSupervisorId] : null;
      
      projects.push({
        id: doc.id,
        ...projectData,
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
      message: "Projects retrieved successfully",
      projects
    });

  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      students,
      supervisorId,
      coSupervisorId,
      sustainability
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!title || !description || !supervisorId || !sustainability) {
      return res.status(400).json({ 
        message: "Title, description, supervisor, and sustainability are required" 
      });
    }

    // Validate students array (max 4 students)
    if (students && students.length > 4) {
      return res.status(400).json({ 
        message: "Maximum 4 students allowed per project" 
      });
    }

    // Create project data
    const projectData = {
      title,
      description,
      students: students || [],
      supervisorId,
      coSupervisorId: coSupervisorId || null,
      sustainability,
      imageUrl: null,
      status: 'pending',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add project to Firestore
    const docRef = await addDoc(collection(db, 'projects'), projectData);

    // Create notification for supervisor about new project assignment
    if (supervisorId) {
      try {
        const teamMembersText = students?.map(s => s.name).join(', ') || 'No team members';
        
        await createNotification(supervisorId, {
          title: 'New Project Assignment',
          message: `You have been assigned as supervisor for the project "${title}" by ${teamMembersText}`,
          type: 'info',
          category: 'project',
          data: {
            projectId: docRef.id,
            projectTitle: title,
            teamMembers: teamMembersText,
            submissionDate: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        console.error("Error creating supervisor notification:", notificationError);
      }
    }

    // Create notification for co-supervisor if assigned
    if (coSupervisorId && coSupervisorId !== supervisorId) {
      try {
        const teamMembersText = students?.map(s => s.name).join(', ') || 'No team members';
        
        await createNotification(coSupervisorId, {
          title: 'New Co-Supervisor Assignment',
          message: `You have been assigned as co-supervisor for the project "${title}" by ${teamMembersText}`,
          type: 'info',
          category: 'project',
          data: {
            projectId: docRef.id,
            projectTitle: title,
            teamMembers: teamMembersText,
            submissionDate: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        console.error("Error creating co-supervisor notification:", notificationError);
      }
    }

    // Handle image upload if provided
    if (req.file) {
      try {
        const imageUrl = await uploadImage(req.file, docRef.id);
        
        // Update project with image URL
        await updateDoc(doc(db, 'projects', docRef.id), {
          imageUrl,
          updatedAt: new Date().toISOString()
        });
        
        projectData.imageUrl = imageUrl;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        // Continue without image if upload fails
      }
    }

    res.status(201).json({
      message: "Project created successfully",
      project: {
        id: docRef.id,
        ...projectData
      }
    });

  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Upload project image (separate endpoint)
export const uploadProjectImage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Check if project exists and user owns it
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return res.status(404).json({ message: "Project not found" });
    }

    const projectData = projectDoc.data();
    if (projectData.createdBy !== userId) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }

    // Delete old image if exists
    if (projectData.imageUrl) {
      try {
        const oldImageRef = ref(firebaseStorage, projectData.imageUrl);
        await deleteObject(oldImageRef);
      } catch (deleteError) {
        console.error("Error deleting old image:", deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Upload new image
    const imageUrl = await uploadImage(req.file, projectId);

    // Update project with new image URL
    await updateDoc(projectRef, {
      imageUrl,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl
    });

  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
        title: 'Project Status Updated',
        message: `Your project "${projectData.title}" status has been changed to ${status.replace('-', ' ').toUpperCase()}${reviewComment ? ` with comment: "${reviewComment}"` : ''}`,
        type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
        category: 'project',
        data: {
          projectId,
          projectTitle: projectData.title,
          oldStatus: projectData.status,
          newStatus: status,
          reviewComment,
          reviewerName
        }
      });
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    // Send email notification if requested
    if (sendEmail && projectData.createdBy) {
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

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return res.status(404).json({ message: "Project not found" });
    }

    const projectData = projectDoc.data();

    // Check if user owns the project or is admin
    if (projectData.createdBy !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    // Delete associated image if exists
    if (projectData.imageUrl) {
      try {
        const imageRef = ref(firebaseStorage, projectData.imageUrl);
        await deleteObject(imageRef);
      } catch (deleteError) {
        console.error("Error deleting project image:", deleteError);
        // Continue with project deletion even if image delete fails
      }
    }

    // Delete project document
    await deleteDoc(projectRef);

    res.status(200).json({ message: "Project deleted successfully" });

  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Advanced search across projects
export const searchProjects = async (req, res) => {
  try {
    const {
      q: searchQuery = '',
      status = '',
      supervisor = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const userId = req.user.id;
    const userRole = req.user.role;

    const projectsRef = collection(db, 'projects');
    let queries = [];

    // Base query - if not admin, only show user's projects
    if (userRole !== 'admin') {
      queries.push(where('createdBy', '==', userId));
    }

    // Status filter
    if (status) {
      queries.push(where('status', '==', status));
    }

    // Supervisor filter
    if (supervisor) {
      queries.push(where('supervisor', '==', supervisor));
    }

    // Date range filter
    if (startDate) {
      queries.push(where('createdAt', '>=', startDate));
    }
    if (endDate) {
      queries.push(where('createdAt', '<=', endDate));
    }

    // Build Firestore query
    let q = query(projectsRef, ...queries);

    // Add sorting
    if (sortBy && ['createdAt', 'updatedAt', 'title', 'status'].includes(sortBy)) {
      q = query(q, orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc'));
    }

    const snapshot = await getDocs(q);
    let projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side text search (since Firestore doesn't support full-text search)
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      projects = projects.filter(project => {
        return (
          project.title?.toLowerCase().includes(searchTerm) ||
          project.description?.toLowerCase().includes(searchTerm) ||
          project.teamMembers?.some(member => 
            member.name?.toLowerCase().includes(searchTerm) ||
            member.email?.toLowerCase().includes(searchTerm)
          ) ||
          project.supervisorName?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Pagination
    const totalResults = projects.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProjects = projects.slice(startIndex, endIndex);

    // Calculate pagination info
    const totalPages = Math.ceil(totalResults / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      message: "Search completed successfully",
      data: {
        projects: paginatedProjects,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        },
        searchCriteria: {
          query: searchQuery,
          status,
          supervisor,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error("Search projects error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get search filters data (for dropdowns)
export const getSearchFilters = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get unique statuses
    const projectsRef = collection(db, 'projects');
    let statusQuery = projectsRef;
    
    if (userRole !== 'admin') {
      statusQuery = query(projectsRef, where('createdBy', '==', userId));
    }

    const projectsSnapshot = await getDocs(statusQuery);
    const projects = projectsSnapshot.docs.map(doc => doc.data());

    // Extract unique values
    const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];
    const supervisors = [...new Set(projects.map(p => ({
      id: p.supervisor,
      name: p.supervisorName
    })).filter(s => s.id))];

    // Get teachers for supervisor dropdown
    const teachersRef = collection(db, 'teachers');
    const teachersSnapshot = await getDocs(teachersRef);
    const teachers = teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().fullName || doc.data().name
    }));

    res.status(200).json({
      message: "Filter options retrieved successfully",
      filters: {
        statuses: [
          'pending',
          'under-review', 
          'approved',
          'rejected',
          'revision-required'
        ],
        supervisors: teachers,
        dateRange: {
          earliest: projects.length > 0 ? 
            Math.min(...projects.map(p => new Date(p.createdAt).getTime())) : 
            new Date().getTime(),
          latest: new Date().getTime()
        }
      }
    });

  } catch (error) {
    console.error("Get search filters error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
