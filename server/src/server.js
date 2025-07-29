import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import projectRouter from './routes/project.route.js';
import teacherRouter from './routes/teacher.route.js';
import adminRouter from './routes/admin.route.js';

import './config/firebase.config.js';

dotenv.config('../');


const app = express();
// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// Parse application/json
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(helmet());

app.use('/api/user', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/teachers', teacherRouter);
app.use('/api/admin', adminRouter);


app.listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('Firebase initialized with config:', process.env.NODE_ENV);
});

