import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser
} from '../../controllers/admin/userController.js';
import { authenticateAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// User management routes
router.get('/', getAllUsers);
router.put('/:userId/role', updateUserRole);
router.put('/:userId/status', updateUserStatus);
router.delete('/:userId', deleteUser);

export default router;
