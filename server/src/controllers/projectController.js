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
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: "Valid status (pending, approved, rejected) is required" 
      });
    }

    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return res.status(404).json({ message: "Project not found" });
    }

    await updateDoc(projectRef, {
      status,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      message: "Project status updated successfully",
      status
    });

  } catch (error) {
    console.error("Update project status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
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
