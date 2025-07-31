import { Router } from "express";
import userRoutes from "./userRoutes.js";
import projectRoutes from "./projectRoutes.js";
import teacherRoutes from "./teacherRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";

const router = Router();

// Mount admin sub-routes
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/teachers', teacherRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
