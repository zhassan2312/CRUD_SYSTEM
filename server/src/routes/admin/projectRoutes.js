import express from 'express';
import {
  getAllProjects,
  updateProjectStatus,
  bulkUpdateProjects,
  getFileStatistics
} from '../../controllers/admin/projectController.js';
import { authenticateAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Project management routes
router.get('/', getAllProjects);
router.put('/:projectId/status', updateProjectStatus);
router.put('/bulk', bulkUpdateProjects);
router.get('/file-statistics', getFileStatistics);

export default router;
