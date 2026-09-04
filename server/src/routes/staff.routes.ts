import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();
const adminOnly = [Role.ADMIN];

const publicUserSelect = {
  id: true, staffId: true, firstName: true, lastName: true, email: true,
  isEmailVerified: true, phoneNumber: true, isPhoneVerified: true,
  department: true, jobTitle: true, role: true, createdAt: true, updatedAt: true,
};

router.get('/', authenticateToken, async (_req: AuthRequest, res: Response) => {
  const staff = await prisma.user.findMany({ select: publicUserSelect, orderBy: { lastName: 'asc' } });
  return res.json({ success: true, data: staff });
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const staff = await prisma.user.findUnique({ where: { id: req.params.id }, select: publicUserSelect });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
  return res.json({ success: true, data: staff });
});

router.post('/', authenticateToken, requireRoles(adminOnly), async (req: AuthRequest, res: Response) => {
  const { staffId, firstName, lastName, email, password, phoneNumber, department, jobTitle, role } = req.body || {};
  if (!staffId || !firstName || !lastName || !email || !password || !department || !jobTitle) {
    return res.status(400).json({ success: false, message: 'staffId, name, email, password, department and jobTitle are required' });
  }
  if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

  const passwordHash = await bcrypt.hash(String(password), 12);
  const user = await prisma.user.create({
    data: {
      staffId: String(staffId).trim(), firstName: String(firstName).trim(), lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(), passwordHash, phoneNumber: phoneNumber || null,
      department: String(department).trim(), jobTitle: String(jobTitle).trim(),
      role: Object.values(Role).includes(role) ? role : Role.STAFF,
    },
    select: publicUserSelect,
  });
  return res.status(201).json({ success: true, data: user });
});

router.patch('/:id', authenticateToken, requireRoles(adminOnly), async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, phoneNumber, department, jobTitle, role, password } = req.body || {};
  const data: Record<string, unknown> = {};
  for (const key of ['firstName', 'lastName', 'email', 'phoneNumber', 'department', 'jobTitle']) {
    if (req.body?.[key] !== undefined) data[key] = key === 'email' ? String(req.body[key]).trim().toLowerCase() : req.body[key];
  }
  if (role !== undefined && Object.values(Role).includes(role)) data.role = role;
  if (password !== undefined) {
    if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    data.passwordHash = await bcrypt.hash(String(password), 12);
  }
  if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'No valid fields supplied' });

  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: publicUserSelect });
  return res.json({ success: true, data: user });
});

router.delete('/:id', authenticateToken, requireRoles(adminOnly), async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  await prisma.user.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Staff member deleted' });
});

export default router;
