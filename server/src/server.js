import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import projectRouter from './routes/project.route.js';
import teacherRouter from './routes/teacher.route.js';
import adminRouter from './routes/admin.route.js';

import './config/firebase.config.js';

dotenv.config('../');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to login and registration routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// Parse application/json
app.use(express.json({ limit: '10mb' }));
// Parse cookies
app.use(cookieParser());

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['set-cookie']
}));

// Apply auth rate limiting to specific routes
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);

app.use('/api/user', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/teachers', teacherRouter);
app.use('/api/admin', adminRouter);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({ 
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message 
    });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('Firebase initialized with config:', process.env.NODE_ENV);
});

