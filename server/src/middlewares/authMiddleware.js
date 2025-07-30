import jwt from 'jsonwebtoken';
import env from '../config/env.config.js';
import { doc, getDoc, users } from '../config/firebase.config.js';

const JWT_SECRET = env.JWT_SECRET;

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from Firestore
    const userRef = doc(users, decoded.id);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }
    
    const userData = userDoc.data();
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      uid: decoded.id, // Add uid for Firebase compatibility
      email: userData.email,
      role: userData.role,
      fullName: userData.fullName
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Admin authentication middleware
export const authenticateAdmin = async (req, res, next) => {
  try {
    // First, authenticate the user
    await authMiddleware(req, res, () => {});
    
    // Then check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication error' 
    });
  }
};
