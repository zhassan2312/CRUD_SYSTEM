import { Router } from "express";
import multer from "multer";
import { registerUser, getUser, getAllUsers, loginUser, checkAuth, logoutUser, editUser, resetPassword, verifyEmail, resendVerificationEmail, syncEmailVerification, deleteUser, updateUserRole } from "../controllers/user.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Configure multer for file uploads
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

// Public routes (no authentication required)
router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', loginUser);
router.put('/resetPassword', resetPassword);
router.post('/verifyEmail', verifyEmail);
router.post('/resendVerificationEmail', resendVerificationEmail);
router.post('/syncEmailVerification', syncEmailVerification);

// Protected routes (authentication required)
router.get('/checkAuth', checkAuth);
router.post('/logout', authenticateToken, logoutUser);
router.get('/getUser/:id', authenticateToken, getUser);
router.put('/updateUser/:id', authenticateToken, upload.single('profilePic'), editUser);

// Admin only routes
router.get('/getAllUsers', authenticateToken, requireAdmin, getAllUsers);
router.delete('/deleteUser/:id', authenticateToken, requireAdmin, deleteUser);
router.put('/updateUserRole/:userId', authenticateToken, requireAdmin, updateUserRole);

export default router;