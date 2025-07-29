import { Router } from "express";
import multer from "multer";
import { registerUser, getUser, getAllUsers, loginUser, checkAuth, logoutUser, editUser, resetPassword, verifyEmail, resendVerificationEmail, syncEmailVerification, deleteUser, updateUserRole } from "../controllers/user.controller.js";
import { users, admin, getDocs, doc, updateDoc } from "../config/firebase.config.js";

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

router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', loginUser);
router.get('/checkAuth',checkAuth);
router.put('/resetPassword', resetPassword);
router.post('/verifyEmail', verifyEmail);
router.post('/resendVerificationEmail', resendVerificationEmail);
router.get('/getUser/:id', getUser);
router.get('/getAllUsers', getAllUsers);

router.put('/updateUser/:id', upload.single('profilePic'), editUser);
router.delete('/deleteUser/:id', deleteUser);
router.get('/logout/:id', logoutUser);

// Admin routes
router.put('/updateUserRole/:userId', updateUserRole);

router.post('/syncEmailVerification', syncEmailVerification);





export default router;