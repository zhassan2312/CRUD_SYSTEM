import { Router } from "express";
import multer from "multer";
import {
  getAllTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacher
} from "../controllers/teacherController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { teacherSchema } from "../utils/validators.js";

const router = Router();

// Configure multer for teacher profile image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// All routes require authentication
router.use(authMiddleware);

// Teacher routes with proper role checks
router.get('/', getAllTeachers); // Allow all authenticated users to view teachers list
router.get('/:id', getTeacher);
router.post('/', upload.single('profileImage'), validate(teacherSchema), checkRole('admin'), addTeacher);
router.put('/:id', upload.single('profileImage'), validate(teacherSchema), checkRole('admin'), updateTeacher);
router.delete('/:id', checkRole('admin'), deleteTeacher);

export default router;
