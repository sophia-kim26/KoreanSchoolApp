import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import tasRoutes from './routes/tas.js';
import shiftsRoutes from './routes/shifts.js';
import attendanceRoutes from './routes/attendance.js';
import fridayRouter from './routes/friday.js';
import parentRoutes from './routes/parents.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', 'client', '.env') });

const app = express();
app.set('trust proxy', 1); 
app.use(cors({
  origin: ['http://localhost:5173', 'https://korean-school-app-2.vercel.app']
}))
app.use(express.json()); 

// Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/tas', tasRoutes);
app.use('/api/friday', fridayRouter);  // Mount at /api/friday, router handles /
app.use('/api', authRoutes);
app.use('/api/parents', parentRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

// To this:
// if (process.env.NODE_ENV !== 'production') {
//   app.listen(3001);
// }
export default app;