import { PrismaClient, Role, ProjectStatus, Priority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      staffId: 'STF-0001',
      firstName: 'John',
      lastName: 'Mensah',
      email: 'admin@company.com',
      passwordHash,
      department: 'Executive',
      jobTitle: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.create({
    data: {
      staffId: 'STF-0002',
      firstName: 'Ama',
      lastName: 'Boateng',
      email: 'ama.boateng@company.com',
      passwordHash,
      department: 'Engineering',
      jobTitle: 'Engineering Manager',
      role: Role.PROJECT_MANAGER,
    },
  });

  const staff = await prisma.user.create({
    data: {
      staffId: 'STF-0003',
      firstName: 'Kofi',
      lastName: 'Osei',
      email: 'kofi.osei@company.com',
      passwordHash,
      department: 'Engineering',
      jobTitle: 'Frontend Engineer',
      role: Role.STAFF,
    },
  });

  const project = await prisma.project.create({
    data: {
      projectCode: 'PRJ-0001',
      name: 'Corporate Portal Redesign',
      description: 'Modernization of corporate digital platforms',
      managerId: pm.id,
      createdById: admin.id,
      startDate: new Date('2026-08-01'),
      dueDate: new Date('2026-11-30'),
      status: ProjectStatus.IN_PROGRESS,
      priority: Priority.HIGH,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id },
      { projectId: project.id, userId: pm.id },
      { projectId: project.id, userId: staff.id },
    ],
  });

  const task = await prisma.task.create({
    data: {
      taskCode: 'TSK-0001',
      projectId: project.id,
      title: 'UI/UX Design Phase',
      description: 'Design all essential wireframes and component libraries',
      assigneeId: staff.id,
      reviewerId: pm.id,
      createdById: pm.id,
      startDate: new Date('2026-08-02'),
      dueDate: new Date('2026-08-20'),
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
    },
  });

  const subtask = await prisma.subtask.create({
    data: {
      subtaskCode: 'SUB-0001',
      taskId: task.id,
      title: 'Create Dashboard Layout Wireframe',
      description: 'Construct interactive SVG prototypes',
      assigneeId: staff.id,
      reviewerId: pm.id,
      createdById: pm.id,
      startDate: new Date('2026-08-05'),
      dueDate: new Date('2026-08-12'),
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
    },
  });

  await prisma.comment.create({
    data: {
      subtaskId: subtask.id,
      authorId: staff.id,
      content: 'Initial dashboard wireframe submitted for manager review.',
    },
  });

  console.log('Database Seed Executed Successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });