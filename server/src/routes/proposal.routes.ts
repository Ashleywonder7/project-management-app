import { Router, Response } from 'express';
import { ProposalStatus, Role } from '@prisma/client';
import { prisma } from '../../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const writeRoles = [Role.ADMIN, Role.PROJECT_MANAGER];

const include = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  assignedStaff: { include: { user: { select: { id: true, staffId: true, firstName: true, lastName: true } } } },
};

router.get('/', authenticateToken, async (_req: AuthRequest, res: Response) => {
  const proposals = await prisma.proposal.findMany({ include, orderBy: { deadline: 'asc' } });
  return res.json({ success: true, data: proposals });
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.id }, include });
  if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
  return res.json({ success: true, data: proposal });
});

router.post('/', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { code, title, description, deadline, status, comments, assignedStaffIds = [] } = req.body || {};
  if (!code || !title || !deadline) return res.status(400).json({ success: false, message: 'code, title and deadline are required' });
  if (status && !Object.values(ProposalStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid proposal status' });
  if (!Array.isArray(assignedStaffIds)) return res.status(400).json({ success: false, message: 'assignedStaffIds must be an array' });

  const proposal = await prisma.proposal.create({
    data: {
      code: String(code).trim(), title: String(title).trim(), description: description || null,
      deadline: new Date(deadline), status: status || ProposalStatus.DRAFT, comments: comments || null,
      createdById: req.user!.id,
      assignedStaff: { create: assignedStaffIds.map((userId: string) => ({ userId })) },
    }, include,
  });
  return res.status(201).json({ success: true, data: proposal });
});

router.patch('/:id', authenticateToken, requireRoles(writeRoles), async (req: AuthRequest, res: Response) => {
  const { code, title, description, deadline, status, comments, assignedStaffIds } = req.body || {};
  if (status !== undefined && !Object.values(ProposalStatus).includes(status)) return res.status(400).json({ success: false, message: 'Invalid proposal status' });
  const data: Record<string, unknown> = {};
  for (const key of ['code', 'title']) if (req.body?.[key] !== undefined) data[key] = String(req.body[key]).trim();
  if (description !== undefined) data.description = description || null;
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (status !== undefined) data.status = status;
  if (comments !== undefined) data.comments = comments || null;
  if (!Object.keys(data).length && assignedStaffIds === undefined) return res.status(400).json({ success: false, message: 'No valid fields supplied' });
  if (assignedStaffIds !== undefined && !Array.isArray(assignedStaffIds)) return res.status(400).json({ success: false, message: 'assignedStaffIds must be an array' });

  const proposal = await prisma.$transaction(async (tx) => {
    if (assignedStaffIds !== undefined) {
      await tx.proposalAssignment.deleteMany({ where: { proposalId: req.params.id } });
      await tx.proposalAssignment.createMany({ data: assignedStaffIds.map((userId: string) => ({ proposalId: req.params.id, userId })) });
    }
    return tx.proposal.update({ where: { id: req.params.id }, data, include });
  });
  return res.json({ success: true, data: proposal });
});

router.delete('/:id', authenticateToken, requireRoles([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  await prisma.proposal.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Proposal deleted' });
});

export default router;
