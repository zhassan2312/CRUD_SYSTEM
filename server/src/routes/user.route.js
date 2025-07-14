import { Router } from "express";
import { addUser,getUser,getAllUsers,deleteUser,editUser} from "../controllers/user.controller.js";

const router = Router();

router.post('/addUser',addUser);
router.get('/getAllUsers',getAllUsers);
router.get('/getUser/:id',getUser);
router.put('/updateUser/:id', editUser);
router.delete('/deleteUser/:id', deleteUser);



export default router;