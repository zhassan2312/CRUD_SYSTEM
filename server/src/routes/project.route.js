import express from 'express';
import { 
  createProject, 
  getUserProjects, 
  getAllProjects, 
  updateProject, 
  deleteProject, 
  getProjectById,
  updateProjectStatus,
  getProjectsForReview,
  getProjectStatusHistory
} from '../controllers/project.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create new project
router.post('/', authenticateToken, createProject);

// Get user's projects
router.get('/user', authenticateToken, getUserProjects);

// Get all projects (admin only)
router.get('/', authenticateToken, getAllProjects);

// Get project by ID
router.get('/:id', authenticateToken, getProjectById);

// Update project
router.put('/:id', authenticateToken, updateProject);

// Delete project
router.delete('/:id', authenticateToken, deleteProject);

// Project Status Management Routes
// Get projects for review (admin/teacher only)
router.get('/review/list', authenticateToken, getProjectsForReview);

// Update project status (admin/teacher only)
router.put('/:id/status', authenticateToken, updateProjectStatus);

// Get project status history
router.get('/:id/status-history', authenticateToken, getProjectStatusHistory);

export default router;
