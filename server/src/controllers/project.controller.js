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
  orderBy,
  mail
} from '../config/firebase.config.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

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
  
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// Delete image from Firebase Storage
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    const imageRef = ref(firebaseStorage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

export const createProject = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { title, description, sustainability, supervisor, coSupervisor, students } = req.body;
      const userId = req.user.uid;
      
      // Parse students JSON
      let parsedStudents = [];
      try {
        parsedStudents = JSON.parse(students);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid students data format' });
      }

      // Validate required fields
      if (!title || !description || !sustainability || !supervisor || !parsedStudents.length) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create project document
      const projectData = {
        title,
        description,
        sustainability,
        supervisor,
        coSupervisor: coSupervisor || '',
        students: parsedStudents,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      };

      // Add project to Firestore
      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      
      // Upload image if provided
      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadImage(req.file, projectRef.id);
        await updateDoc(projectRef, { imageUrl });
      }

      res.status(201).json({ 
        message: 'Project created successfully', 
        projectId: projectRef.id 
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Failed to create project' });
    }
  }
];

export const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const q = query(
      collection(db, 'projects'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const q = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const userRole = req.user.role;
    
    const projectDoc = await getDoc(doc(db, 'projects', id));
    
    if (!projectDoc.exists()) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = { id: projectDoc.id, ...projectDoc.data() };
    
    // Check if user has permission to view this project
    if (userRole !== 'admin' && project.createdBy !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};

export const updateProject = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, sustainability, supervisor, coSupervisor, students } = req.body;
      const userId = req.user.uid;
      
      // Get existing project
      const projectDoc = await getDoc(doc(db, 'projects', id));
      
      if (!projectDoc.exists()) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const existingProject = projectDoc.data();
      
      // Check if user has permission to update this project
      if (req.user.role !== 'admin' && existingProject.createdBy !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Parse students JSON
      let parsedStudents = [];
      try {
        parsedStudents = JSON.parse(students);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid students data format' });
      }

      // Prepare update data
      const updateData = {
        title,
        description,
        sustainability,
        supervisor,
        coSupervisor: coSupervisor || '',
        students: parsedStudents,
        updatedAt: new Date()
      };

      // Handle image update
      if (req.file) {
        // Delete old image if exists
        if (existingProject.imageUrl) {
          await deleteImage(existingProject.imageUrl);
        }
        
        // Upload new image
        const imageUrl = await uploadImage(req.file, id);
        updateData.imageUrl = imageUrl;
      }

      // Update project in Firestore
      await updateDoc(doc(db, 'projects', id), updateData);
      
      res.json({ message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Failed to update project' });
    }
  }
];

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    
    // Get existing project
    const projectDoc = await getDoc(doc(db, 'projects', id));
    
    if (!projectDoc.exists()) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const existingProject = projectDoc.data();
    
    // Check if user has permission to delete this project
    if (req.user.role !== 'admin' && existingProject.createdBy !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete image if exists
    if (existingProject.imageUrl) {
      await deleteImage(existingProject.imageUrl);
    }
    
    // Delete project from Firestore
    await deleteDoc(doc(db, 'projects', id));
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

// Project Status Management Functions

export const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, reviewedBy } = req.body;
    const userRole = req.user.role;

    // Check if user has permission to update project status
    if (!['admin', 'teacher'].includes(userRole)) {
      return res.status(403).json({ message: 'Admin or teacher access required' });
    }

    // Validate status
    const validStatuses = ['pending', 'under-review', 'approved', 'rejected', 'revision-required'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Get existing project
    const projectDoc = await getDoc(doc(db, 'projects', id));
    if (!projectDoc.exists()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existingProject = projectDoc.data();

    // Create status history entry
    const statusUpdate = {
      status,
      feedback: feedback || '',
      reviewedBy: req.user.uid,
      reviewerName: req.user.fullName || req.user.email,
      reviewerRole: userRole,
      timestamp: new Date(),
      previousStatus: existingProject.status || 'pending'
    };

    // Update project status and add to history
    const updateData = {
      status,
      lastReviewedAt: new Date(),
      lastReviewedBy: req.user.uid,
      reviewerName: req.user.fullName || req.user.email,
      statusHistory: [...(existingProject.statusHistory || []), statusUpdate],
      updatedAt: new Date()
    };

    // Add feedback if provided
    if (feedback) {
      updateData.lastFeedback = feedback;
    }

    await updateDoc(doc(db, 'projects', id), updateData);

    // Send email notification to project creator
    try {
      await sendStatusChangeNotification(existingProject, status, feedback, req.user);
    } catch (emailError) {
      console.error('Error sending status change notification:', emailError);
    }

    res.json({ 
      message: 'Project status updated successfully',
      project: {
        id,
        ...existingProject,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ message: 'Failed to update project status' });
  }
};

export const getProjectsForReview = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has permission to review projects
    if (!['admin', 'teacher'].includes(userRole)) {
      return res.status(403).json({ message: 'Admin or teacher access required' });
    }

    const { status = 'all', page = 1, limit = 10 } = req.query;

    // Build query based on status filter
    let q;
    if (status === 'all') {
      q = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'projects'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const projects = [];

    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProjects = projects.slice(startIndex, endIndex);

    res.json({
      projects: paginatedProjects,
      totalProjects: projects.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(projects.length / limit),
      hasNextPage: endIndex < projects.length,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Error fetching projects for review:', error);
    res.status(500).json({ message: 'Failed to fetch projects for review' });
  }
};

export const getProjectStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.uid;

    // Get project
    const projectDoc = await getDoc(doc(db, 'projects', id));
    if (!projectDoc.exists()) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();

    // Check if user has permission to view status history
    if (!['admin', 'teacher'].includes(userRole) && project.createdBy !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const statusHistory = project.statusHistory || [];

    res.json({
      projectId: id,
      projectTitle: project.title,
      currentStatus: project.status || 'pending',
      statusHistory: statusHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    console.error('Error fetching project status history:', error);
    res.status(500).json({ message: 'Failed to fetch project status history' });
  }
};

// Helper function to send status change notifications
const sendStatusChangeNotification = async (project, newStatus, feedback, reviewer) => {
  try {
    // Get project creator details
    const creatorQuery = query(
      collection(db, 'users'),
      where('uid', '==', project.createdBy)
    );
    const creatorSnapshot = await getDocs(creatorQuery);
    
    if (creatorSnapshot.empty) {
      console.warn('Project creator not found for notification');
      return;
    }

    const creator = creatorSnapshot.docs[0].data();
    
    // Prepare email content based on status
    let subject, htmlContent;
    
    switch (newStatus) {
      case 'approved':
        subject = `✅ Your project "${project.title}" has been approved!`;
        htmlContent = `
          <h2>Congratulations! Your project has been approved</h2>
          <p>Dear <strong>${creator.fullName}</strong>,</p>
          <p>Great news! Your project "<strong>${project.title}</strong>" has been approved by ${reviewer.fullName || reviewer.email}.</p>
          ${feedback ? `<p><strong>Reviewer's Comments:</strong><br/>${feedback}</p>` : ''}
          <p>You can now proceed with your project implementation.</p>
          <p>Best regards,<br/>The Academic Team</p>
        `;
        break;
        
      case 'rejected':
        subject = `❌ Your project "${project.title}" requires attention`;
        htmlContent = `
          <h2>Project Review Update</h2>
          <p>Dear <strong>${creator.fullName}</strong>,</p>
          <p>Your project "<strong>${project.title}</strong>" has been reviewed by ${reviewer.fullName || reviewer.email}.</p>
          <p><strong>Status:</strong> Rejected</p>
          ${feedback ? `<p><strong>Feedback:</strong><br/>${feedback}</p>` : ''}
          <p>Please review the feedback and consider resubmitting with the suggested improvements.</p>
          <p>Best regards,<br/>The Academic Team</p>
        `;
        break;
        
      case 'revision-required':
        subject = `📝 Revision required for your project "${project.title}"`;
        htmlContent = `
          <h2>Project Revision Required</h2>
          <p>Dear <strong>${creator.fullName}</strong>,</p>
          <p>Your project "<strong>${project.title}</strong>" has been reviewed by ${reviewer.fullName || reviewer.email}.</p>
          <p><strong>Status:</strong> Revision Required</p>
          ${feedback ? `<p><strong>Feedback:</strong><br/>${feedback}</p>` : ''}
          <p>Please make the suggested revisions and resubmit your project.</p>
          <p>Best regards,<br/>The Academic Team</p>
        `;
        break;
        
      case 'under-review':
        subject = `🔍 Your project "${project.title}" is under review`;
        htmlContent = `
          <h2>Project Under Review</h2>
          <p>Dear <strong>${creator.fullName}</strong>,</p>
          <p>Your project "<strong>${project.title}</strong>" is now under review by ${reviewer.fullName || reviewer.email}.</p>
          <p>We'll notify you once the review is complete.</p>
          <p>Best regards,<br/>The Academic Team</p>
        `;
        break;
        
      default:
        return; // Don't send notification for other status changes
    }

    // Send email using Firebase Extensions
    await addDoc(mail, {
      to: [creator.email],
      message: {
        subject,
        html: htmlContent
      }
    });

  } catch (error) {
    console.error('Error sending status change notification:', error);
    throw error;
  }
};
