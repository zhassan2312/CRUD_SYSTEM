import { Router } from "express";
import multer from "multer";
import { addUser,getUser,getAllUsers,deleteUser,editUser} from "../controllers/user.controller.js";

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

router.post('/addUser', upload.single('profilePic'), addUser);
router.get('/getAllUsers',getAllUsers);
router.get('/getUser/:id',getUser);
router.put('/updateUser/:id', upload.single('profilePic'), editUser);
router.delete('/deleteUser/:id', deleteUser);



export default router;