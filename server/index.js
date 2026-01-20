import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import tasRoutes from './routes/tas.js';
import shiftsRoutes from './routes/shifts.js';
import attendanceRoutes from './routes/attendance.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', 'client', '.env') });

const app = express();
app.set('trust proxy', 1); 
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/tas', tasRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/attendance', attendanceRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});