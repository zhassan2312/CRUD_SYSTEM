import { Router } from "express";
import { getAdminStats } from "../controllers/admin.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Admin stats route - requires admin authentication
router.get('/stats', authenticateToken, requireAdmin, getAdminStats);

export default router;
