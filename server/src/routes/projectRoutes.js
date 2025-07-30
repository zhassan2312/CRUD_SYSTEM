import { Router } from "express";
import multer from "multer";
import {
  getAllProjectsForUser,
  createProject,
  uploadProjectImage,
  getAllProjects,
  updateProjectStatus,
  deleteProject,
  searchProjects,
  getSearchFilters
} from "../controllers/projectController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { projectSchema } from "../utils/validators.js";

const router = Router();

// Configure multer for project image uploads
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

// User project routes
router.get('/', getAllProjectsForUser);
router.get('/search', searchProjects);
router.get('/search/filters', getSearchFilters);
router.post('/', upload.single('projectImage'), validate(projectSchema), createProject);
router.post('/:projectId/upload-image', upload.single('projectImage'), uploadProjectImage);
router.delete('/:projectId', deleteProject);

// Admin project routes
router.get('/admin', checkRole('admin'), getAllProjects);
router.put('/:projectId/status', checkRole('admin'), updateProjectStatus);

export default router;
