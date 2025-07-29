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
const uploadImage = async (file, teacherId) => {
  if (!file) return null;
  
  const fileName = `teachers/${teacherId}/${Date.now()}_${file.originalname}`;
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

export const createTeacher = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { fullName, email, department, specialization, phoneNumber, isAdmin } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !department || !specialization) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create teacher document
      const teacherData = {
        fullName,
        email,
        department,
        specialization,
        phoneNumber: phoneNumber || '',
        isAdmin: isAdmin === 'true' || isAdmin === true, // Convert string to boolean
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add teacher to Firestore
      const teacherRef = await addDoc(collection(db, 'teachers'), teacherData);
      
      // Upload profile picture if provided
      let profilePicUrl = null;
      if (req.file) {
        profilePicUrl = await uploadImage(req.file, teacherRef.id);
        await updateDoc(teacherRef, { profilePicUrl });
      }

      res.status(201).json({ 
        message: 'Teacher created successfully', 
        teacherId: teacherRef.id 
      });
    } catch (error) {
      console.error('Error creating teacher:', error);
      res.status(500).json({ message: 'Failed to create teacher' });
    }
  }
];

export const getAllTeachers = async (req, res) => {
  try {
    const q = query(
      collection(db, 'teachers'),
      orderBy('fullName', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const teachers = [];
    
    querySnapshot.forEach((doc) => {
      teachers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const teacherDoc = await getDoc(doc(db, 'teachers', id));
    
    if (!teacherDoc.exists()) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const teacher = { id: teacherDoc.id, ...teacherDoc.data() };
    
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Failed to fetch teacher' });
  }
};

export const updateTeacher = [
  upload.single('profilePic'),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { fullName, email, department, specialization, phoneNumber, isAdmin } = req.body;
      
      // Get existing teacher
      const teacherDoc = await getDoc(doc(db, 'teachers', id));
      
      if (!teacherDoc.exists()) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      
      const existingTeacher = teacherDoc.data();

      // Prepare update data
      const updateData = {
        fullName,
        email,
        department,
        specialization,
        phoneNumber: phoneNumber || '',
        isAdmin: isAdmin === 'true' || isAdmin === true, // Convert string to boolean
        updatedAt: new Date()
      };

      // Handle profile picture update
      if (req.file) {
        // Delete old image if exists
        if (existingTeacher.profilePicUrl) {
          await deleteImage(existingTeacher.profilePicUrl);
        }
        
        // Upload new image
        const profilePicUrl = await uploadImage(req.file, id);
        updateData.profilePicUrl = profilePicUrl;
      }

      // Update teacher in Firestore
      await updateDoc(doc(db, 'teachers', id), updateData);
      
      res.json({ message: 'Teacher updated successfully' });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({ message: 'Failed to update teacher' });
    }
  }
];

export const deleteTeacher = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    
    // Get existing teacher
    const teacherDoc = await getDoc(doc(db, 'teachers', id));
    
    if (!teacherDoc.exists()) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const existingTeacher = teacherDoc.data();
    
    // Delete profile picture if exists
    if (existingTeacher.profilePicUrl) {
      await deleteImage(existingTeacher.profilePicUrl);
    }
    
    // Delete teacher from Firestore
    await deleteDoc(doc(db, 'teachers', id));
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'Failed to delete teacher' });
  }
};
