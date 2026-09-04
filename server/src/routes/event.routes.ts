import { Router, Response } from 'express';
import { EventStatus, Role } from '@prisma/client';
import { prisma } from '../../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const writeRoles = [Role.ADMIN, Role.PROJECT_MANAGER];

const eventInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  schedules: { orderBy: { date: 'asc' as const } },
  assignedStaff: { include: { user: { select: { id: true, staffId: true, firstName: true, lastName: true } } } },
};

router.get('/', authenticateToken, async (_req: AuthRequest, res: Response) => {
  const events = await prisma.event.findMany({ include: eventInclude, orderBy: { createdAt: 'desc' } });
  return res.json({ success: true, data: events });
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: eventInclude });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  return res.json({ success: true, data: event });
});

router.post('/', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { title, description, venue, status, schedules = [], assignedStaffIds = [] } = req.body || {};
  if (!title || !venue) return res.status(400).json({ success: false, message: 'title and venue are required' });
  if (status && !Object.values(EventStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid event status' });
  if (!Array.isArray(schedules) || !Array.isArray(assignedStaffIds)) return res.status(400).json({ success: false, message: 'schedules and assignedStaffIds must be arrays' });

  const event = await prisma.event.create({
    data: {
      title: String(title).trim(), description: description || null, venue: String(venue).trim(),
      status: status || EventStatus.UPCOMING, createdById: req.user!.id,
      schedules: { create: schedules.map((s: any) => ({ date: new Date(s.date), startTime: String(s.startTime), endTime: String(s.endTime) })) },
      assignedStaff: { create: assignedStaffIds.map((userId: string) => ({ userId })) },
    }, include: eventInclude,
  });
  return res.status(201).json({ success: true, data: event });
});

router.patch('/:id', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { title, description, venue, status, completedAt, schedules, assignedStaffIds } = req.body || {};
  if (status !== undefined && !Object.values(EventStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid event status' });
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = String(title).trim();
  if (description !== undefined) data.description = description || null;
  if (venue !== undefined) data.venue = String(venue).trim();
  if (status !== undefined) data.status = status;
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
  if (!Object.keys(data).length && schedules === undefined && assignedStaffIds === undefined) return res.status(400).json({ success: false, message: 'No valid fields supplied' });

  const event = await prisma.$transaction(async (tx) => {
    if (schedules !== undefined) {
      await tx.eventSchedule.deleteMany({ where: { eventId: req.params.id } });
      await tx.eventSchedule.createMany({ data: schedules.map((s: any) => ({ eventId: req.params.id, date: new Date(s.date), startTime: String(s.startTime), endTime: String(s.endTime) })) });
    }
    if (assignedStaffIds !== undefined) {
      await tx.eventStaffAssignment.deleteMany({ where: { eventId: req.params.id } });
      await tx.eventStaffAssignment.createMany({ data: assignedStaffIds.map((userId: string) => ({ eventId: req.params.id, userId })) });
    }
    return tx.event.update({ where: { id: req.params.id }, data, include: eventInclude });
  });

  return res.json({ success: true, data: event });
});

router.delete('/:id', authenticateToken, requireRoles([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  await prisma.event.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Event deleted' });
});

export default router;
