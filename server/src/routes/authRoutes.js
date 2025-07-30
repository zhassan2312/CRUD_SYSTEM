import { Router } from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logoutUser,
  resendVerificationEmail
} from "../controllers/authController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  userRegistrationSchema,
  userLoginSchema,
  passwordResetSchema,
  emailSchema
} from "../utils/validators.js";

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

// Auth routes
router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/logout', logoutUser);

export default router;
