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
} from '../../config/firebase.config.js';
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
const uploadTeacherImage = async (file, teacherId) => {
  if (!file) return null;
  
  const fileName = `teachers/${teacherId}/${Date.now()}_${file.originalname}`;
  const storageRef = ref(firebaseStorage, fileName);
  
  const snapshot = await uploadBytes(storageRef, file.buffer, {
    contentType: file.mimetype
  });
  
  return await getDownloadURL(snapshot.ref);
};

// Add new teacher
export const addTeacher = async (req, res) => {
  try {
    const { name, email, department, specialization } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        message: "Name and email are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if teacher with email already exists
    const teachersRef = collection(db, 'teachers');
    const snapshot = await getDocs(teachersRef);
    const existingTeacher = snapshot.docs.find(doc => doc.data().email === email);
    
    if (existingTeacher) {
      return res.status(400).json({ 
        message: "Teacher with this email already exists" 
      });
    }

    // Create teacher data
    const teacherData = {
      name,
      fullName: name, // Add fullName alias for frontend compatibility
      email,
      department: department || '',
      specialization: specialization || '',
      profileUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add teacher to Firestore
    const docRef = await addDoc(teachersRef, teacherData);

    // Handle image upload if provided
    if (req.file) {
      try {
        const profileUrl = await uploadTeacherImage(req.file, docRef.id);
        
        // Update teacher with profile image URL
        await updateDoc(doc(db, 'teachers', docRef.id), {
          profileUrl,
          updatedAt: new Date().toISOString()
        });
        
        teacherData.profileUrl = profileUrl;
      } catch (uploadError) {
        console.error("Profile image upload error:", uploadError);
        // Continue without image if upload fails
      }
    }

    res.status(201).json({
      message: "Teacher added successfully",
      teacher: {
        id: docRef.id,
        ...teacherData
      }
    });

  } catch (error) {
    console.error("Add teacher error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update teacher
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, specialization } = req.body;

    // Check if teacher exists
    const teacherRef = doc(db, 'teachers', id);
    const teacherDoc = await getDoc(teacherRef);

    if (!teacherDoc.exists()) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const currentData = teacherDoc.data();

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already used by another teacher
      if (email !== currentData.email) {
        const teachersRef = collection(db, 'teachers');
        const snapshot = await getDocs(teachersRef);
        const existingTeacher = snapshot.docs.find(doc => 
          doc.data().email === email && doc.id !== id
        );
        
        if (existingTeacher) {
          return res.status(400).json({ 
            message: "Email is already used by another teacher" 
          });
        }
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (name) {
      updateData.name = name;
      updateData.fullName = name; // Keep fullName alias in sync
    }
    if (email) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (specialization !== undefined) updateData.specialization = specialization;

    // Handle image upload if provided
    if (req.file) {
      try {
        // Delete old image if exists
        if (currentData.profileUrl) {
          try {
            const oldImageRef = ref(firebaseStorage, currentData.profileUrl);
            await deleteObject(oldImageRef);
          } catch (deleteError) {
            console.error("Error deleting old profile image:", deleteError);
            // Continue with upload even if delete fails
          }
        }

        // Upload new image
        const profileUrl = await uploadTeacherImage(req.file, id);
        updateData.profileUrl = profileUrl;
      } catch (uploadError) {
        console.error("Profile image upload error:", uploadError);
        return res.status(500).json({ message: "Error uploading profile image" });
      }
    }

    // Update teacher document
    await updateDoc(teacherRef, updateData);

    // Get updated teacher data
    const updatedTeacherDoc = await getDoc(teacherRef);
    const updatedTeacher = {
      id: updatedTeacherDoc.id,
      ...updatedTeacherDoc.data()
    };

    res.status(200).json({
      message: "Teacher updated successfully",
      teacher: updatedTeacher
    });

  } catch (error) {
    console.error("Update teacher error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if teacher exists
    const teacherRef = doc(db, 'teachers', id);
    const teacherDoc = await getDoc(teacherRef);

    if (!teacherDoc.exists()) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacherData = teacherDoc.data();

    // Delete associated profile image if exists
    if (teacherData.profileUrl) {
      try {
        const imageRef = ref(firebaseStorage, teacherData.profileUrl);
        await deleteObject(imageRef);
      } catch (deleteError) {
        console.error("Error deleting teacher profile image:", deleteError);
        // Continue with teacher deletion even if image delete fails
      }
    }

    // Check if teacher is assigned to any projects
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    const assignedProjects = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.supervisorId === id || data.coSupervisorId === id;
    });

    if (assignedProjects.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete teacher. They are assigned to ${assignedProjects.length} project(s).` 
      });
    }

    // Delete teacher document
    await deleteDoc(teacherRef);

    res.status(200).json({ message: "Teacher deleted successfully" });

  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
