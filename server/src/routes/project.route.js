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
import { authenticateToken, requireTeacherOrAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create new project (authenticated users)
router.post('/', authenticateToken, createProject);

// Get user's own projects
router.get('/user', authenticateToken, getUserProjects);

// Get project by ID (project owner or admin/teacher)
router.get('/:id', authenticateToken, getProjectById);

// Update project (project owner only)
router.put('/:id', authenticateToken, updateProject);

// Delete project (project owner only)
router.delete('/:id', authenticateToken, deleteProject);

// Admin/Teacher only routes
// Get all projects (admin/teacher only)
router.get('/', authenticateToken, requireTeacherOrAdmin, getAllProjects);

// Get projects for review (admin/teacher only)
router.get('/review/list', authenticateToken, requireTeacherOrAdmin, getProjectsForReview);

// Update project status (admin/teacher only)
router.put('/:id/status', authenticateToken, requireTeacherOrAdmin, updateProjectStatus);

// Get project status history (admin/teacher only)
router.get('/:id/status-history', authenticateToken, requireTeacherOrAdmin, getProjectStatusHistory);

export default router;
