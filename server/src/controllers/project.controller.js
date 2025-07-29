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
