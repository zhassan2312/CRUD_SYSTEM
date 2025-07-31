import { Router } from "express";
import multer from "multer";
import {
  addTeacher,
  updateTeacher,
  deleteTeacher
} from "../../controllers/admin/teacherController.js";
import { authenticateAdmin } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { teacherSchema } from "../../utils/validators.js";

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

// All routes require admin authentication
router.use(authenticateAdmin);

// Teacher management routes for admins
router.post('/', upload.single('profileImage'), validate(teacherSchema), addTeacher);
router.put('/:id', upload.single('profileImage'), validate(teacherSchema), updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
