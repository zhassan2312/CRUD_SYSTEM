import { Router } from "express";
import multer from "multer";
import {
    getCurrentUserProfile,
    updateUserProfile,
    changePassword,
    updateUserPreferences,
    deleteUserAccount,
    getUserStats
} from "../../controllers/user/profileController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = Router();

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// All routes require authentication
router.use(authMiddleware);

// Profile management routes
router.get('/profile', getCurrentUserProfile);
router.put('/profile', upload.single('profilePicture'), updateUserProfile);
router.put('/change-password', changePassword);
router.put('/preferences', updateUserPreferences);
router.delete('/delete-account', deleteUserAccount);
router.get('/stats', getUserStats);

export default router;
