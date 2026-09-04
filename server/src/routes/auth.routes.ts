import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'fallback_secret') {
    throw Object.assign(new Error('JWT_SECRET is not configured'), { statusCode: 500 });
  }
  return secret;
};

const signToken = (user: { id: string; email: string; role: string }) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '8h' });

router.post('/login', async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = signToken(user);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return res.json({ success: true, token, user: safeUser });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, staffId: true, firstName: true, lastName: true, email: true,
      isEmailVerified: true, phoneNumber: true, isPhoneVerified: true,
      department: true, jobTitle: true, role: true, createdAt: true, updatedAt: true,
    },
  });

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, user });
});

export default router;
