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
        
        // Generate email verification token
        const verificationToken = jwt.sign(
            { 
                id: docRef.id,
                email: userData.email,
                purpose: 'email-verification'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send verification email by adding to mail collection
        try {
            await sendVerificationEmail(userData.email, userData.fullName, verificationToken);
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // Continue with registration even if email fails
        }

        res.status(201).json({
            message: "User registered successfully. Please check your email to verify your account.",
            user: {
                id: docRef.id,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role,
                profilePicUrl: userData.profilePicUrl,
                emailVerified: userData.emailVerified
            },
            requiresVerification: true
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

        // Check if email is verified
        if (!userData.emailVerified) {
            return res.status(403).json({ 
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
                requiresVerification: true,
                email: userData.email
            });
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
        
        // Check if token is for email verification
        if (decoded.purpose !== 'email-verification') {
            return res.status(400).json({ message: "Invalid verification token" });
        }

        const userId = decoded.id;

        // Find user by ID
        const userRef = doc(users, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();

        // Check if already verified
        if (userData.emailVerified) {
            return res.status(200).json({ 
                message: "Email already verified",
                alreadyVerified: true
            });
        }

        // Update email verification status
        await updateDoc(userRef, {
            emailVerified: true,
            emailVerifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ 
            message: "Email verified successfully! You can now login.",
            verified: true
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ 
                message: "Invalid or expired verification token. Please request a new verification email.",
                expired: true
            });
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

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find user by email
        const snapshot = await getDocs(users);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);

        if (!userDoc) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userDoc.data();
        const userId = userDoc.id;

        // Check if already verified
        if (userData.emailVerified) {
            return res.status(400).json({ 
                message: "Email is already verified",
                alreadyVerified: true
            });
        }

        // Generate new verification token
        const verificationToken = jwt.sign(
            { 
                id: userId,
                email: userData.email,
                purpose: 'email-verification'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send verification email
        await sendVerificationEmail(userData.email, userData.fullName, verificationToken);

        res.status(200).json({ 
            message: "Verification email sent successfully. Please check your inbox.",
            sent: true
        });

    } catch (error) {
        console.error("Resend verification email error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Helper function to send verification email
const sendVerificationEmail = async (email, fullName, verificationToken) => {
    try {
        const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        const emailData = {
            to: [email],
            message: {
                subject: 'Verify Your Email - Project Management System',
                html: generateVerificationEmailHTML(fullName, verificationLink)
            },
            createdAt: new Date().toISOString()
        };

        // Add to mail collection for Firebase extension to process
        await addDoc(mail, emailData);
        console.log(`Verification email queued for ${email}`);

    } catch (error) {
        console.error("Error queuing verification email:", error);
        throw error;
    }
};

// Helper function to generate verification email HTML
const generateVerificationEmailHTML = (fullName, verificationLink) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2196f3; margin-bottom: 10px;">Welcome to Project Management System!</h1>
                <p style="color: #666; font-size: 16px;">Please verify your email address to complete your registration</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">Hello ${fullName}!</h2>
                <p style="margin-bottom: 20px;">Thank you for signing up for our Project Management System. To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" 
                       style="background-color: #2196f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>

                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    If the button above doesn't work, you can also copy and paste the following link into your browser:
                </p>
                <p style="background-color: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all;">
                    ${verificationLink}
                </p>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    <strong>Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you'll need to request a new verification email.
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px; margin-bottom: 10px;">
                    This email was sent because you created an account on our Project Management System.
                </p>
                <p style="color: #666; font-size: 12px; margin: 0;">
                    If you didn't create this account, please ignore this email.
                </p>
            </div>
        </body>
        </html>
    `;
};
