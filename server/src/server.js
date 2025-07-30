import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import utilities
import { globalErrorHandler } from './utils/responseHelpers.js';

// Initialize Firebase
import './config/firebase.config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(globalErrorHandler);

// Handle multer-specific errors in the global handler
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 400;
  }
  
  if (error.message === 'Only image files are allowed!') {
    error.statusCode = 400;
  }
  
  globalErrorHandler(error, req, res, next);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
