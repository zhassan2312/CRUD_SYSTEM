import express from 'express';
import { 
  createProject, 
  getUserProjects, 
  getAllProjects, 
  updateProject, 
  deleteProject, 
  getProjectById 
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

export default router;
