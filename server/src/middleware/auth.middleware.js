import jwt from 'jsonwebtoken';
import env from '../config/env.config.js';
import { doc, getDoc } from '../config/firebase.config.js';
import { users } from '../config/firebase.config.js';

export const authenticateToken = async (req, res, next) => {
  // First try to get token from cookie (preferred method)
  let token = req.cookies?.authToken;
  
  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Verify user still exists in database
    const userDocRef = doc(users, decoded.id);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add user data to request object
    req.user = {
      ...decoded,
      fullName: userDoc.data().fullName,
      profilePic: userDoc.data().profilePic
    };
    
    next();
  } catch (err) {
    console.log('JWT verification error:', err.message);
    
    // Clear invalid cookie
    if (req.cookies?.authToken) {
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }
    
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireTeacherOrAdmin = (req, res, next) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Teacher or admin access required' });
  }
  next();
};
