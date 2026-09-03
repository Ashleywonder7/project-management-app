import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Map Prisma enum "PROJECT_MANAGER" to UI "PROJECT MANAGER"
    const mapped = staff.map(s => ({
      ...s,
      name: `${s.firstName} ${s.lastName}`,
      nickname: s.staffId, // Or custom nickname field
      role: s.role === 'PROJECT_MANAGER' ? 'PROJECT MANAGER' : s.role,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff directory' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, nickname, email, department, role } = req.body;
    const [firstName, ...lastNameParts] = name.split(' ');
    const dbRole = role === 'PROJECT MANAGER' ? 'PROJECT_MANAGER' : role;

    const newStaff = await prisma.user.create({
      data: {
        staffId: nickname,
        firstName,
        lastName: lastNameParts.join(' ') || ' ',
        email,
        passwordHash: 'default_hash', // Replace with bcrypt hash in production
        department,
        jobTitle: 'Team Member',
        role: dbRole,
      },
    });
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create staff member' });
  }
};