import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import your routes
import authRoutes from '../routes/auth.js';
import tasRoutes from '../routes/tas.js';
import shiftsRoutes from '../routes/shifts.js';
import attendanceRoutes from '../routes/attendance.js';
import fridayRouter from '../routes/friday.js';
import parentRoutes from '../routes/parents.js';
import { errorHandler } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is reachable!" });
});

// 1. Fix: Basic Security/Proxy setting
app.set('trust proxy', 1); 

// 2. Fix: Clean CORS implementation
// Remove the 'const express = require' lines entirely
app.use(cors({
  origin: "https://korean-school-app-2.vercel.app", 
  methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 

// 3. Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/tas', tasRoutes);
app.use('/api/friday', fridayRouter);
app.use('/api', authRoutes);
app.use('/api/parents', parentRoutes);

// 4. Error handling
app.use(errorHandler);

// 5. CRITICAL: Export for Vercel
export default app;