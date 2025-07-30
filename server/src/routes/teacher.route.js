import express from 'express';
import { 
  createTeacher, 
  getAllTeachers, 
  updateTeacher, 
  deleteTeacher, 
  getTeacherById 
} from '../controllers/teacher.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all teachers (accessible to authenticated users)
router.get('/', authenticateToken, getAllTeachers);

// Get teacher by ID (accessible to authenticated users)
router.get('/:id', authenticateToken, getTeacherById);

// Admin only routes
// Create new teacher (admin only)
router.post('/', authenticateToken, requireAdmin, createTeacher);

// Update teacher (admin only)
router.put('/:id', authenticateToken, requireAdmin, updateTeacher);

// Delete teacher (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteTeacher);

export default router;
