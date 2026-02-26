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

app.use((req, res, next) => {
  console.log("Requested Path:", req.path);
  next();
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

// Change these lines to mount at root
app.use('/', authRoutes);
app.use('/', attendanceRoutes);
app.use('/', shiftsRoutes);
app.use('/', tasRoutes);
app.use('/', fridayRouter);
app.use('/', parentRoutes);

// 4. Error handling
app.use(errorHandler);

// 5. CRITICAL: Export for Vercel
export default app;