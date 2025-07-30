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
import {
  uploadProjectFiles,
  getProjectFiles,
  deleteProjectFile,
  downloadProjectFile,
  previewProjectFile,
  getFileStatistics
} from "../controllers/fileManager.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { projectSchema } from "../utils/validators.js";

const router = Router();

// Configure multer for project file uploads
const storage = multer.memoryStorage();

// Enhanced file filter for multiple file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Archives
        'application/zip',
        'application/x-rar-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed!`), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    },
    fileFilter
});

// Create separate upload configurations
const imageUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for images
    },
    fileFilter: (req, file, cb) => {
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

// Create project with single image
router.post('/', imageUpload.single('projectImage'), validate(projectSchema), createProject);

// File management routes
router.post('/:projectId/files', upload.array('files', 10), uploadProjectFiles);
router.get('/:projectId/files', getProjectFiles);
router.delete('/:projectId/files/:fileId', deleteProjectFile);
router.get('/:projectId/files/:fileId/download', downloadProjectFile);
router.get('/:projectId/files/:fileId/preview', previewProjectFile);

// Legacy image upload route (maintained for compatibility)
router.post('/:projectId/upload-image', imageUpload.single('projectImage'), uploadProjectImage);

// Project management routes
router.delete('/:projectId', deleteProject);

// Admin project routes
router.get('/admin', checkRole('admin'), getAllProjects);
router.put('/:projectId/status', checkRole('admin'), updateProjectStatus);
router.get('/admin/file-statistics', checkRole('admin'), getFileStatistics);

export default router;
