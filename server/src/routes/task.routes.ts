import { Router, Response } from 'express';
import { Priority, Role, TaskStatus } from '@prisma/client';
import { prisma } from '../../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const writeRoles = [Role.ADMIN, Role.PROJECT_MANAGER];
const taskInclude = {
  project: { select: { id: true, code: true, name: true } },
  assignee: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const where = req.query.projectId ? { projectId: String(req.query.projectId) } : {};
  const tasks = await prisma.task.findMany({ where, include: taskInclude, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }] });
  return res.json({ success: true, data: tasks });
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: taskInclude });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  return res.json({ success: true, data: task });
});

router.post('/', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body || {};
  if (!title || !projectId) return res.status(400).json({ success: false, message: 'title and projectId are required' });
  if (status && !Object.values(TaskStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid task status' });
  if (priority && !Object.values(Priority).includes(priority)) return res.status(400).json({ success: false, message: 'Invalid task priority' });

  const task = await prisma.task.create({
    data: { title: String(title).trim(), description: description || null, status: status || TaskStatus.TODO, priority: priority || Priority.MEDIUM, dueDate: dueDate ? new Date(dueDate) : null, projectId, assigneeId: assigneeId || null, createdById: req.user!.id },
    include: taskInclude,
  });
  return res.status(201).json({ success: true, data: task });
});

router.patch('/:id', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body || {};
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = String(title).trim();
  if (description !== undefined) data.description = description || null;
  if (status !== undefined) {
    if (!Object.values(TaskStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid task status' });
    data.status = status;
  }
  if (priority !== undefined) {
    if (!Object.values(Priority).includes(priority)) return res.status(400).json({ success: false, message: 'Invalid task priority' });
    data.priority = priority;
  }
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (projectId !== undefined) data.projectId = projectId;
  if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
  if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'No valid fields supplied' });

  const task = await prisma.task.update({ where: { id: req.params.id }, data, include: taskInclude });
  return res.json({ success: true, data: task });
});

router.delete('/:id', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Task deleted' });
});

export default router;
