import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import goalsRoutes from './routes/goals';
import progressRoutes from './routes/progress';
import routinesRoutes from './routes/routines';
import developmentsRoutes from './routes/developments';
import developmentProgressRoutes from './routes/development-progress';
import faqsRoutes from './routes/faqs';
import dailyHistoryRoutes from './routes/daily-history';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/goals', goalsRoutes);
app.use('/api/v1/monthly-progress', progressRoutes);
app.use('/api/v1/daily-tasks', routinesRoutes);
app.use('/api/v1/developments', developmentsRoutes);
app.use('/api/v1/development-progress', developmentProgressRoutes);
app.use('/api/v1/faqs', faqsRoutes);
app.use('/api/v1/daily-tasks/history', dailyHistoryRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);





// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '予期せぬエラーが発生しました。' } });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
