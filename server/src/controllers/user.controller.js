import {users,admin, addDoc,mail, doc, getDoc, getDocs, deleteDoc, updateDoc} from '../config/firebase.config.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.config.js';
const JWT_SECRET = env.JWT_SECRET;
import { uploadFileAndGetUrl } from '../config/gcloud.config.js';

const registerUser = async(req, res) => {
    try {
        const {
            fullName,
            password,
            email,
            gender,
            age,
            role
        } = req.body;

        let profilePicUrl = '';
        if (req.file) {
            try {
                const fileObject = {
                    buffer: req.file.buffer,
                    name: req.file.originalname,
                    type: req.file.mimetype
                };
                profilePicUrl = await uploadFileAndGetUrl(fileObject);
            } catch (uploadError) {
                console.error("Error uploading file:", uploadError);
            }
        }

        if (!fullName || !password || !email || !gender || !age) {
            return res.status(400).json("All fields are required");
        }

        // Create user in Firebase Auth
        let userRecord;
        try {
            userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: fullName
            });
        } catch (authError) {
            console.error("Error creating Firebase Auth user:", authError);
            return res.status(500).json("Error creating user in Firebase Auth");
        }

        // Add user to Firestore
        const docRef = await addDoc(users, {
            uid: userRecord.uid,
            fullName,
            email,
            password,
            gender,
            age,
            profilePic: profilePicUrl,
            role: role || 'user', // Use provided role or default to 'user'
            emailVerified: false, // Initially false
            createdAt: new Date()
        });

        // Send email verification link using Trigger Email extension
        try {
            const verificationLink = await admin.auth().generateEmailVerificationLink(email);
            await addDoc(mail, {
                to: [email],
                message: {
                    subject: 'Verify your email address',
                    text: `Hello ${fullName},\n\nPlease verify your email address by clicking the following link:\n${verificationLink}\n\nThank you!`,
                    html: `<p>Hello <strong>${fullName}</strong>,</p><p>Please verify your email address by clicking the link below:</p><p><a href='${verificationLink}'>Verify Email</a></p><p>Thank you!</p>`
                }
            });
        } catch (emailError) {
            console.error('Error generating or sending email verification link:', emailError);
        }

        res.status(201).json({
            message: "User added successfully",
            user: {
                id: docRef.id,
                uid: userRecord.uid,
                fullName,
                email,
                gender,
                age,
                role: 'user',
                emailVerified: false, 
                profilePic: profilePicUrl,
                createdAt: new Date()
            }
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

const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json("Email and password are required");
        }
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email && doc.data().password === password);
        if (!userDoc) {
            return res.status(401).json("Invalid email or password");
        }

        // Check email verification status from Firebase Auth
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            
            // If Firebase Auth shows email as verified but Firestore doesn't, update Firestore
            if (userRecord.emailVerified && !userDoc.data().emailVerified) {
                await updateDoc(doc(users, userDoc.id), { 
                    emailVerified: true, 
                    updatedAt: new Date() 
                });
            }
            
            // Check if email is verified (from Firebase Auth)
            if (!userRecord.emailVerified) {
                return res.status(403).json("Email not verified");
            }
        } catch (authError) {
            console.error("Error checking Firebase Auth user:", authError);
            return res.status(500).json("Error checking user verification status");
        }

        // Issue JWT token
        const userData = { 
            id: userDoc.id, 
            uid: userDoc.data().uid, 
            email: userDoc.data().email,
            role: userDoc.data().role || 'user' // Include role in token
        };
        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({
            message: "Login successful",
            token,
            user: { 
                id: userDoc.id, 
                ...userDoc.data(),
                emailVerified: true // Make sure we return the updated status
            }
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json("Error logging in user");
    }
}

const logoutUser = async(req, res) => {
    const id = req.params.id;
    res.status(200).json("Logout successful");
}

const editUser = async(req, res) => {
    try {
        const id = req.params.id;
        console.log("Update request for ID:", id);
        console.log("Request body:", req.body);
        
        const userDocRef = doc(users, id);
        const existingUser = await getDoc(userDocRef);
        if (!existingUser.exists()) {
            return res.status(404).json("User not found");
        }
        const currentUserData = existingUser.data();

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

        // Handle file upload for update
        let profilePicUrl = currentUserData.profilePic;
        if (req.file) {
            try {
                const fileObject = {
                    buffer: req.file.buffer,
                    name: req.file.originalname,
                    type: req.file.mimetype
                };
                profilePicUrl = await uploadFileAndGetUrl(fileObject);
                console.log("File updated successfully:", profilePicUrl);
            } catch (uploadError) {
                console.error("Error uploading file during update:", uploadError);
                // Keep the existing profile pic if upload fails
                console.log("Keeping existing profile pic due to storage error");
            }
        }

        await updateDoc(userDocRef, {
            fullName,
            email,
            password,
            gender,
            age,
            profilePic: profilePicUrl,
            updatedAt: new Date()
        });
        console.log("User updated successfully:", id);
        res.status(200).json("User updated successfully");
    } catch(error) {
        console.error("Error editing user:", error);
        res.status(500).json("Error editing user");
    }
}

const resetPassword = async(req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json("New password is required");
        }
        if (!email) {
            return res.status(400).json("Email is required");
        }
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);
        if (!userDoc) {
            return res.status(404).json("User not found");
        }
        const userDocRef = doc(users, userDoc.id);
        // Update password in Firebase Auth
        try {
            await admin.auth().updateUser(userDoc.data().uid, { password: newPassword });
        } catch (authError) {
            console.error("Error updating password in Firebase Auth:", authError);
            return res.status(500).json("Error updating password in Firebase Auth");
        }
        // Also update password in Firestore for consistency
        await updateDoc(userDocRef, { 
            password: newPassword,
            updatedAt: new Date() 
        });
        res.status(200).json("Password reset successfully");
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json("Error resetting password");
    }
}

const verifyEmail = async(req, res) => {
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

        // Check if user exists in Firebase Auth and get their verification status
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            
            if (userRecord.emailVerified) {
                // Update Firestore if Firebase Auth shows email as verified
                await updateDoc(doc(users, userDoc.id), { 
                    emailVerified: true, 
                    updatedAt: new Date() 
                });
                
                res.status(200).json({
                    message: "Email verified successfully",
                    user: {
                        id: userDoc.id,
                        ...userDoc.data(),
                        emailVerified: true
                    }
                });
            } else {
                res.status(400).json("Email not verified yet");
            }
        } catch (authError) {
            console.error("Error checking email verification:", authError);
            res.status(500).json("Error checking email verification");
        }
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json("Error verifying email");
    }
}
        
const deleteUser = async(req, res) => {
    try {
        const id = req.params.id;
        const userDocRef = doc(users, id);
        const user = await getDoc(userDocRef);
        if (!user.exists()) {
            return res.status(404).json("User not found");
        }
        // Delete user from Firebase Auth
        try {
            await admin.auth().deleteUser(user.data().uid);
        } catch (authError) {
            console.error("Error deleting user in Firebase Auth:", authError);
            return res.status(500).json("Error deleting user in Firebase Auth");
        }
        await deleteDoc(userDocRef);
        res.status(200).json("User deleted successfully");
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json("Error deleting user");
    }
}

const resendVerificationEmail = async(req, res) => {
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

        if (userDoc.data().emailVerified) {
            return res.status(400).json("Email is already verified");
        }

        // Send email verification link using Trigger Email extension
        try {
            const verificationLink = await admin.auth().generateEmailVerificationLink(email);
            await addDoc(mail, {
                to: [email],
                message: {
                    subject: 'Verify your email address',
                    text: `Hello ${userDoc.data().fullName},\n\nPlease verify your email address by clicking the following link:\n${verificationLink}\n\nThank you!`,
                    html: `<p>Hello <strong>${userDoc.data().fullName}</strong>,</p><p>Please verify your email address by clicking the link below:</p><p><a href='${verificationLink}'>Verify Email</a></p><p>Thank you!</p>`
                }
            });
            res.status(200).json("Verification email sent successfully");
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            res.status(500).json("Error sending verification email");
        }
    } catch (error) {
        console.error("Error resending verification email:", error);
        res.status(500).json("Error resending verification email");
    }
}

const checkAuth = async(req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json("Unauthorized");
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userDocRef = doc(users, decoded.id);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            return res.status(404).json("User not found");
        }
        res.status(200).json({
            id: userDoc.id,
            ...userDoc.data()
        });
    } catch (error) {
        console.error("Error checking authentication:", error);
        res.status(500).json("Error checking authentication");
    }
}

const getAllUsers = async(req, res) => {
    try {
        const snapshot = await getDocs(users);
        const usersList = [];
        snapshot.forEach((doc) => {
            usersList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        res.status(200).json(usersList);
    } catch (error) {
        console.error("Error getting all users:", error);
        res.status(500).json("Error getting all users");
    }
}

const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Validate role
        if (!role || !['admin', 'user'].includes(role)) {
            return res.status(400).json("Invalid role. Must be 'admin' or 'user'");
        }

        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json("User not found");
        }

        // Update user role in Firestore
        await updateDoc(userDocRef, {
            role: role,
            updatedAt: new Date()
        });

        res.status(200).json("User role updated successfully");
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json("Error updating user role");
    }
};

const syncEmailVerification = async(req, res) => {
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
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            
            if (userRecord.emailVerified && !userDoc.data().emailVerified) {
                // Update Firestore to match Firebase Auth status
                await updateDoc(doc(users, userDoc.id), { 
                    emailVerified: true, 
                    updatedAt: new Date() 
                });
                
                res.status(200).json({
                    message: "Email verification status synced",
                    verified: true,
                    user: {
                        id: userDoc.id,
                        ...userDoc.data(),
                        emailVerified: true
                    }
                });
            } else {
                res.status(200).json({
                    message: "Email verification status checked",
                    verified: userRecord.emailVerified
                });
            }
        } catch (authError) {
            console.error("Error syncing email verification:", authError);
            res.status(500).json("Error syncing email verification");
        }
    } catch (error) {
        console.error("Error syncing email verification:", error);
        res.status(500).json("Error syncing email verification");
    }
}

export {
  registerUser,
  getUser,
  getAllUsers,
  loginUser,
  logoutUser,
  editUser,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  syncEmailVerification,
  deleteUser,
  checkAuth,
  updateUserRole
};