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

// Teacher routes (Admin only)
router.get('/', checkRole('admin'), getAllTeachers);
router.get('/:id', checkRole('admin'), getTeacher);
router.post('/', checkRole('admin'), upload.single('profileImage'), validate(teacherSchema), addTeacher);
router.put('/:id', checkRole('admin'), upload.single('profileImage'), validate(teacherSchema), updateTeacher);
router.delete('/:id', checkRole('admin'), deleteTeacher);

export default router;
