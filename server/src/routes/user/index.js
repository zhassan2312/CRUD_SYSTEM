import { Router } from "express";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoutes.js";
import projectRoutes from "./projectRoutes.js";
import teacherRoutes from "./teacherRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

// Mount user sub-routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/projects', projectRoutes);
router.use('/teachers', teacherRoutes);
router.use('/notifications', notificationRoutes);

export default router;
