import { users, admin, addDoc, mail, doc, getDoc, getDocs, deleteDoc, updateDoc } from '../config/firebase.config.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import env from '../config/env.config.js';
import { uploadFileAndGetUrl } from '../config/gcloud.config.js';

const JWT_SECRET = env.JWT_SECRET;

// Register User
export const registerUser = async (req, res) => {
    try {
        const { fullName, password, email, gender, age, role } = req.body;

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
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Check if user already exists
        const snapshot = await getDocs(users);
        const existingUser = snapshot.docs.find(doc => doc.data().email === email);
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user data
        const userData = {
            fullName,
            email,
            password: hashedPassword,
            gender,
            age: parseInt(age),
            role: role || 'user',
            profilePicUrl,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add user to Firestore
        const docRef = await addDoc(users, userData);
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: docRef.id, 
                email: userData.email, 
                role: userData.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: docRef.id,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role,
                profilePicUrl: userData.profilePicUrl
            },
            token
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);

        if (!userDoc) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const userData = userDoc.data();
        const userId = userDoc.id;

        // Verify password
        const isValidPassword = await bcrypt.compare(password, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: userId, 
                email: userData.email, 
                role: userData.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: userId,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role,
                profilePicUrl: userData.profilePicUrl
            },
            token
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find user by email
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);

        if (!userDoc) {
            // Don't reveal if user exists or not
            return res.status(200).json({ message: "If the email exists, a reset link has been sent" });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { email: email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send email (implement your email service here)
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        // For now, just return the token (implement actual email sending)
        res.status(200).json({
            message: "Reset link sent to email",
            resetToken // Remove this in production
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        // Verify reset token
        const decoded = jwt.verify(token, JWT_SECRET);
        const email = decoded.email;

        // Find user by email
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);

        if (!userDoc) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const userRef = doc(users, userDoc.id);
        await updateDoc(userRef, {
            password: hashedPassword,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Verify Email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const email = decoded.email;

        // Find user by email
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);

        if (!userDoc) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update email verification status
        const userRef = doc(users, userDoc.id);
        await updateDoc(userRef, {
            emailVerified: true,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ message: "Email verified successfully" });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }
        console.error("Email verification error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Logout User
export const logoutUser = async (req, res) => {
    try {
        // Clear cookie
        res.clearCookie('authToken');
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
