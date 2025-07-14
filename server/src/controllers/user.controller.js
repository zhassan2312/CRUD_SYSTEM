import {users, addDoc, doc, getDoc, getDocs, deleteDoc, updateDoc} from '../config/firebase.config.js';
const addUser = async(req, res) => {
    try {
        // Accept fields directly from req.body
        const {
            fullName,
            password,
            email,
            gender,
            age
        } = req.body;

        if (!fullName || !password || !email || !gender || !age) {
            return res.status(400).json("All fields are required");
        }

        // Use addDoc to auto-generate document ID
        const docRef = await addDoc(users, {
            fullName,
            password,
            email,
            gender,
            age,
            createdAt: new Date()
        });
       
        res.status(201).json({
            message: "User added successfully",
            id: docRef.id
        });
    } catch(error) {
        console.error("Error adding user:", error);
        res.status(500).json("Error adding user");
    }
}

const getUser = async(req, res) => {
    try{
        const id = req.params.id;
        
        const userDocRef = doc(users, id);
        const user = await getDoc(userDocRef);
        if (!user.exists()) {
            return res.status(404).json("User not found");
        }
        res.status(200).json({
            id: user.id,
            ...user.data()
        });
    }catch(error) {
        console.error("Error getting user:", error);
        res.status(500).json("Error getting user");
    }
}

const getAllUsers=async(req, res) => {
    try{
        const snapshot = await getDocs(users);

        const usersList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json(usersList);
    }catch(error) {
        console.error("Error getting all users:", error);
        res.status(500).json("Error getting all users");
    }
}

const deleteUser = async(req, res) => {
    try{
        const id = req.params.id;
        
        const userDocRef = doc(users, id);
        const user = await getDoc(userDocRef);
        if (!user.exists()) {
            return res.status(404).json("User not found");
        }
        await deleteDoc(userDocRef);
        res.status(200).json("User deleted successfully");

    }catch(error) {
        console.error("Error deleting user:", error);
        res.status(500).json("Error deleting user");
    }
}

const editUser = async(req, res) => {
    try {
        const id = req.params.id;
        console.log("Update request for ID:", id);
        console.log("Request body:", req.body);
        
        const userDocRef = doc(users, id);
        const existingUser = await getDoc(userDocRef);
        if (!existingUser.exists()) {
            console.log("User not found with ID:", id);
            return res.status(404).json("User not found");
        }
        
        // Accept fields directly from req.body
        const {
            fullName,
            email,
            password,
            gender,
            age
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !gender || !age) {
            return res.status(400).json("All fields are required");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json("Invalid email format");
        }

        // Check if email is being changed and if the new email already exists
        const currentUserData = existingUser.data();
        if (email !== currentUserData.email) {
            // Check if new email already exists in another user
            const allUsersSnapshot = await getDocs(users);
            const emailExists = allUsersSnapshot.docs.some(doc => 
                doc.id !== id && doc.data().email === email
            );
            
            if (emailExists) {
                return res.status(400).json("Email already exists");
            }
        }

        await updateDoc(userDocRef, {
            fullName,
            email,
            password,
            gender,
            age,
            updatedAt: new Date()
        });
        console.log("User updated successfully:", id);
        res.status(200).json("User updated successfully");
    } catch(error) {
        console.error("Error editing user:", error);
        res.status(500).json("Error editing user");
    }
}

export { addUser, getUser, getAllUsers, deleteUser, editUser };