import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import staffRoutes from './routes/staff.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import subtaskRoutes from './routes/subtask.routes';
import commentRoutes from './routes/comment.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;