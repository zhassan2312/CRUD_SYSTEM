import express from 'express';
import {
  getAllUsers,
  getDashboardStats,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  bulkUpdateProjects,
  getSystemLogs
} from '../controllers/adminController.js';
import { authenticateAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/logs', getSystemLogs);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Project management routes
router.put('/projects/bulk', bulkUpdateProjects);

export default router;
