import { Router } from "express";
import { getAdminStats } from "../controllers/admin.controller.js";

const router = Router();

// Admin stats route
router.get('/stats', getAdminStats);

export default router;
