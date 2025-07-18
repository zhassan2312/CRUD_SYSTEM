import { Router } from "express";
import multer from "multer";
import { registerUser, getUser, loginUser, checkAuth, logoutUser, editUser, resetPassword, verifyEmail, resendVerificationEmail, deleteUser } from "../controllers/user.controller.js";
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
router.put('/resetPassword/:id', resetPassword);
router.post('/verifyEmail', verifyEmail);
router.post('/resendVerificationEmail', resendVerificationEmail);
router.get('/getUser/:id', getUser);

router.put('/updateUser/:id', upload.single('profilePic'), editUser);
router.delete('/deleteUser/:id', deleteUser);
router.get('/logout/:id', logoutUser);

// Test route to manually sync email verification status
router.post('/syncEmailVerification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json("Email is required");
        }

        // Find user by email
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);
        
        if (!userDoc) {
            return res.status(404).json("User not found");
        }

        // Check Firebase Auth verification status
        const userRecord = await admin.auth().getUserByEmail(email);
        
        if (userRecord.emailVerified && !userDoc.data().emailVerified) {
            await updateDoc(doc(users, userDoc.id), { 
                emailVerified: true, 
                updatedAt: new Date() 
            });
            res.status(200).json("Email verification status synced successfully");
        } else if (userRecord.emailVerified) {
            res.status(200).json("Email is already verified in both systems");
        } else {
            res.status(400).json("Email is not verified in Firebase Auth");
        }
    } catch (error) {
        console.error("Error syncing email verification:", error);
        res.status(500).json("Error syncing email verification");
    }
});





export default router;