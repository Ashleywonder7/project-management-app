import { Router, Response } from 'express';
import { ProjectStatus, Role } from '@prisma/client';
import { prisma } from '../../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const writeRoles = [Role.ADMIN, Role.PROJECT_MANAGER];

const projectInclude = {
  manager: { select: { id: true, staffId: true, firstName: true, lastName: true, email: true } },
  _count: { select: { tasks: true } },
};

router.get('/', authenticateToken, async (_req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({ include: projectInclude, orderBy: { updatedAt: 'desc' } });
  return res.json({ success: true, data: projects });
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { ...projectInclude, tasks: { orderBy: { createdAt: 'desc' }, include: { assignee: { select: { id: true, firstName: true, lastName: true } } } } },
  });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  return res.json({ success: true, data: project });
});

router.post('/', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { code, name, description, status, startDate, endDate, managerId } = req.body || {};
  if (!code || !name || !startDate || !managerId) return res.status(400).json({ success: false, message: 'code, name, startDate and managerId are required' });
  if (!Object.values(ProjectStatus).includes(status || ProjectStatus.PLANNING)) return res.status(400).json({ success: false, message: 'Invalid project status' });

  const project = await prisma.project.create({
    data: {
      code: String(code).trim(), name: String(name).trim(), description: description || null,
      status: status || ProjectStatus.PLANNING, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, managerId,
    }, include: projectInclude,
  });
  return res.status(201).json({ success: true, data: project });
});

router.patch('/:id', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { code, name, description, status, startDate, endDate, managerId } = req.body || {};
  const data: Record<string, unknown> = {};
  if (code !== undefined) data.code = String(code).trim();
  if (name !== undefined) data.name = String(name).trim();
  if (description !== undefined) data.description = description || null;
  if (status !== undefined) {
    if (!Object.values(ProjectStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid project status' });
    data.status = status;
  }
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (managerId !== undefined) data.managerId = managerId;
  if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'No valid fields supplied' });

  const project = await prisma.project.update({ where: { id: req.params.id }, data, include: projectInclude });
  return res.json({ success: true, data: project });
});

router.delete('/:id', authenticateToken, requireRoles([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Project deleted' });
});

export default router;
