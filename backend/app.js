import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import { logout } from './controllers/authController.js';
import authMiddleware from './middlewares/auth.js'


dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 200 : 10, 
  message: 'Trop de tentatives, réessayez plus tard.',
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.post('/api/auth/logout', logout);

app.use('/api/auth/me', authMiddleware);
app.use('/api/auth', authRoutes);

export default app;
