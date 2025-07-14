import {users} from '../config/firebase.config.js';
const addUser = async(req, res) => {
    try{
        // Logic to add a user
        const { fullName, Password, email, gender, age } = req.body;

        await users.doc(email).set({
            fullName,
            Password,
            email,
            gender,
            age
        });
        res.status(201).json("User added successfully");

    }catch(error) {
        console.error("Error adding user:", error);
        res.status(500).json("Error adding user");
    }
}

const getUser = async(req, res) => {
    

    try{
        const email = req.params.email;
        const user = await users.doc(email).get();
        if (!user.exists) {
            return res.status(404).json("User not found");
        }
        res.status(200).json(user.data());
    }catch(error) {
        console.error("Error getting user:", error);
        res.status(500).json("Error getting user");
    }
}

const getAllUsers=async(req, res) => {
    try{
        const snapshot = await users.get();

        const usersList = snapshot.docs.map(doc => doc.data());
        console.log("All users:", usersList);
        res.status(200).json(usersList);
    }catch(error) {
        console.error("Error getting all users:", error);
        res.status(500).json("Error getting all users");
    }
}

const deleteUser = async(req, res) => {
    try{
        const email = req.params.email;
        const user = await users.doc(email).get();
        if (!user.exists) {
            return res.status(404).json("User not found");
        }
        await users.doc(email).delete();
        res.status(200).json("User deleted successfully");

    }catch(error) {
        console.error("Error deleting user:", error);
        res.status(500).json("Error deleting user");
    }
}

const editUser = async(req, res) => {
    try{
        const email = req.params.email;
        const user = await users.doc(email).get();
        if (!user.exists) {
            return res.status(404).json("User not found");
        }
        const { fullName, Password, gender, age } = req.body;

        await users.doc(email).update({
            fullName,
            Password,
            gender,
            age
        });
        res.status(200).json("User updated successfully");
        
    }catch(error) {
        console.error("Error editing user:", error);
        res.status(500).json("Error editing user");
    }
}

export { addUser, getUser, getAllUsers, deleteUser, editUser };