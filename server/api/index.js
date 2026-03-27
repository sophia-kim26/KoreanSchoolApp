import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import authRoutes from '../routes/auth.js';
import tasRoutes from '../routes/tas.js';
import shiftsRoutes from '../routes/shifts.js';
import attendanceRoutes from '../routes/attendance.js';
import fridayRouter from '../routes/friday.js';
import saturdayRouter from '../routes/saturday.js';
import parentRoutes from '../routes/parents.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { checkAnyJwt } from '../middleware/protect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// 1. Trust proxy (must be first app.set)
app.set('trust proxy', 1);

// 2. CORS — must be before EVERYTHING else, including routes and body parser
const allowedOrigins = [
  'https://korean-school-app-2.vercel.app',
  'http://localhost:5173',
  process.env.FRONTEND_URL, // fallback for other preview deployments
].filter(Boolean); // remove undefined if FRONTEND_URL isn't set

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 3. Handle preflight for ALL routes
app.options('*', cors());

// 4. Body parser
app.use(express.json());

// 5. Logger (after CORS so preflight requests are also logged correctly)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// 6. Routes
app.get('/api/test', checkAnyJwt, (req, res) => {
  res.json({ message: 'Backend is reachable!' });
});

app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/tas', tasRoutes);
app.use('/api/friday', fridayRouter);
app.use('/api/saturday', saturdayRouter);
app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);

// 7. Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
