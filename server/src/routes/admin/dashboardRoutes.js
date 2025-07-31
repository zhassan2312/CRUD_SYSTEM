import express from 'express';
import {
  getDashboardStats,
  getSystemLogs
} from '../../controllers/admin/dashboardController.js';
import { authenticateAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/logs', getSystemLogs);

export default router;
