import { Router, Response } from 'express';
import { ProjectStatus, TaskStatus } from '@prisma/client';
import { prisma } from '../../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticateToken, async (_req: AuthRequest, res: Response) => {
  const [projects, tasks, overdueTasks, staff, upcomingEvents] = await Promise.all([
    prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.task.count({ where: { dueDate: { lt: new Date() }, status: { not: TaskStatus.COMPLETED } } }),
    prisma.user.count(),
    prisma.event.count({ where: { status: { in: ['UPCOMING', 'DUE'] } } }),
  ]);

  return res.json({
    success: true,
    data: {
      projects: Object.fromEntries(Object.values(ProjectStatus).map((status) => [status, projects.find((p) => p.status === status)?._count._all || 0])),
      tasks: Object.fromEntries(Object.values(TaskStatus).map((status) => [status, tasks.find((t) => t.status === status)?._count._all || 0])),
      overdueTasks,
      staff,
      upcomingEvents,
    },
  });
});

export default router;
