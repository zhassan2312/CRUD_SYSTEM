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

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachersRef = collection(db, 'teachers');
    const snapshot = await getDocs(teachersRef);
    const teachers = [];
    
    snapshot.forEach((doc) => {
      const teacherData = doc.data();
      teachers.push({
        id: doc.id,
        ...teacherData,
        // Ensure fullName property exists for frontend compatibility
        fullName: teacherData.fullName || teacherData.name || ''
      });
    });

    // Sort by fullName on the client side with null checks
    teachers.sort((a, b) => {
      const nameA = a.fullName || '';
      const nameB = b.fullName || '';
      return nameA.localeCompare(nameB);
    });

    res.status(200).json({
      message: "Teachers retrieved successfully",
      teachers
    });

  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get teacher by ID
export const getTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacherRef = doc(db, 'teachers', id);
    const teacherDoc = await getDoc(teacherRef);

    if (!teacherDoc.exists()) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacher = {
      id: teacherDoc.id,
      ...teacherDoc.data()
    };

    res.status(200).json({
      message: "Teacher retrieved successfully",
      teacher
    });

  } catch (error) {
    console.error("Get teacher error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
