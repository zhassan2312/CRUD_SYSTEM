import express from 'express';
import { 
  createTeacher, 
  getAllTeachers, 
  updateTeacher, 
  deleteTeacher, 
  getTeacherById 
} from '../controllers/teacher.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create new teacher (admin only)
router.post('/', authenticateToken, createTeacher);

// Get all teachers
router.get('/', authenticateToken, getAllTeachers);

// Get teacher by ID
router.get('/:id', authenticateToken, getTeacherById);

// Update teacher (admin only)
router.put('/:id', authenticateToken, updateTeacher);

// Delete teacher (admin only)
router.delete('/:id', authenticateToken, deleteTeacher);

export default router;
