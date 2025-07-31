import { Router } from "express";
import {
  getAllTeachers,
  getTeacher
} from "../../controllers/user/teacherController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Teacher routes for regular users (view only)
router.get('/', getAllTeachers); // Allow all authenticated users to view teachers list
router.get('/:id', getTeacher);

export default router;
