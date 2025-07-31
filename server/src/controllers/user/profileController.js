import { 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc,
    query,
    where
} from 'firebase/firestore';
import { users } from '../config/firebase.config.js';
import { deleteObject, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase.config.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Get current user profile
export const getCurrentUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const userData = userDoc.data();
        // Remove sensitive information
        delete userData.password;
        
        res.status(200).json({
            message: "Profile retrieved successfully",
            user: { id: userId, ...userData }
        });
        
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, email, gender, age, bio, phoneNumber, dateOfBirth } = req.body;
        
        // Check if user exists
        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const currentUserData = userDoc.data();
        
        // Check if email is being changed and if it's already taken
        if (email && email !== currentUserData.email) {
            const emailQuery = query(users, where("email", "==", email));
            const emailSnapshot = await getDocs(emailQuery);
            
            if (!emailSnapshot.empty) {
                return res.status(400).json({ message: "Email already exists" });
            }
        }
        
        // Prepare update data
        const updateData = {
            updatedAt: new Date().toISOString()
        };
        
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email;
        if (gender) updateData.gender = gender;
        if (age) updateData.age = parseInt(age);
        if (bio) updateData.bio = bio;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
        
        // Handle profile picture upload
        if (req.file) {
            try {
                // Delete old profile picture if exists
                if (currentUserData.profilePicture) {
                    try {
                        const oldImageRef = ref(storage, `profile-pictures/${userId}`);
                        await deleteObject(oldImageRef);
                    } catch (deleteError) {
                        console.log("Old profile picture not found or already deleted");
                    }
                }
                
                // Upload new profile picture
                const imageRef = ref(storage, `profile-pictures/${userId}`);
                await uploadBytes(imageRef, req.file.buffer);
                const downloadURL = await getDownloadURL(imageRef);
                updateData.profilePicture = downloadURL;
                
            } catch (uploadError) {
                console.error("Profile picture upload error:", uploadError);
                return res.status(500).json({ message: "Failed to upload profile picture" });
            }
        }
        
        // Update user document
        await updateDoc(userDocRef, updateData);
        
        // Get updated user data
        const updatedUserDoc = await getDoc(userDocRef);
        const updatedUserData = updatedUserDoc.data();
        delete updatedUserData.password;
        
        res.status(200).json({
            message: "Profile updated successfully",
            user: { id: userId, ...updatedUserData }
        });
        
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long" });
        }
        
        // Get user document
        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const userData = userDoc.data();
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await updateDoc(userDocRef, {
            password: hashedNewPassword,
            passwordChangedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        res.status(200).json({ message: "Password changed successfully" });
        
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update user preferences/settings
export const updateUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            emailNotifications, 
            projectNotifications, 
            theme, 
            language, 
            timezone 
        } = req.body;
        
        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Prepare preferences update
        const preferencesUpdate = {
            preferences: {
                emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
                projectNotifications: projectNotifications !== undefined ? projectNotifications : true,
                theme: theme || 'light',
                language: language || 'en',
                timezone: timezone || 'UTC'
            },
            updatedAt: new Date().toISOString()
        };
        
        await updateDoc(userDocRef, preferencesUpdate);
        
        res.status(200).json({ 
            message: "Preferences updated successfully",
            preferences: preferencesUpdate.preferences
        });
        
    } catch (error) {
        console.error("Update preferences error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete user account
export const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password, confirmDeletion } = req.body;
        
        if (!password || confirmDeletion !== 'DELETE') {
            return res.status(400).json({ 
                message: "Password and confirmation required. Type 'DELETE' to confirm." 
            });
        }
        
        // Get user document
        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const userData = userDoc.data();
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Incorrect password" });
        }
        
        // Delete profile picture from storage if exists
        if (userData.profilePicture) {
            try {
                const imageRef = ref(storage, `profile-pictures/${userId}`);
                await deleteObject(imageRef);
            } catch (deleteError) {
                console.log("Profile picture not found or already deleted");
            }
        }
        
        // TODO: In a real application, you might want to:
        // 1. Anonymize user data instead of deleting
        // 2. Transfer ownership of projects to another user
        // 3. Send deletion confirmation email
        // 4. Log the deletion for audit purposes
        
        // Delete user document
        await deleteDoc(userDocRef);
        
        res.status(200).json({ 
            message: "Account deleted successfully",
            deletedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get user activity/statistics
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user document
        const userDocRef = doc(users, userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const userData = userDoc.data();
        
        // Calculate user statistics
        const stats = {
            accountCreated: userData.createdAt,
            lastLogin: userData.lastLoginAt,
            profileCompleteness: calculateProfileCompleteness(userData),
            totalProjects: 0, // This would require querying projects collection
            accountAge: calculateAccountAge(userData.createdAt)
        };
        
        res.status(200).json({
            message: "User statistics retrieved successfully",
            stats
        });
        
    } catch (error) {
        console.error("Get user stats error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (userData) => {
    const fields = ['fullName', 'email', 'gender', 'age', 'profilePicture', 'bio', 'phoneNumber'];
    const completedFields = fields.filter(field => userData[field] && userData[field] !== '');
    return Math.round((completedFields.length / fields.length) * 100);
};

// Helper function to calculate account age
const calculateAccountAge = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
        return `${diffDays} days`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''}`;
    }
};
