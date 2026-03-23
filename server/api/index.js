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
import saturdayRouter from '../routes/saturday.js';
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

const allowedOrigins = [
  'https://korean-school-app-2.vercel.app',   // your current frontend
  process.env.FRONTEND_URL,                    // for flexibility across environments
];

// 2. Fix: Clean CORS implementation
// Remove the 'const express = require' lines entirely
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // needed for Auth0 JWT in Authorization header
}));

app.use(express.json()); 

app.options('*', cors()); // handle preflight for all routes

// 3. Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/tas', tasRoutes);
app.use('/api/friday', fridayRouter);
app.use('/api/saturday', saturdayRouter);
app.use('/', authRoutes);
app.use('/api/parents', parentRoutes);

// 4. Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;