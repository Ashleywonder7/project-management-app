import { PrismaClient, Role, Priority, ProjectStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = '$2b$10$e.w27zO/.B4D4x3H73h97O/yH8j13A8.yUeW31vG852Bv8K76s9lW'; // AdminPass123!

  await prisma.user.upsert({
    where: { email: 'admin@schedley.com' },
    update: {},
    create: {
      staffId: 'STF-0001',
      firstName: 'John',
      lastName: 'Mensah',
      email: 'admin@schedley.com',
      passwordHash,
      department: 'Engineering',
      jobTitle: 'System Administrator',
      role: Role.ADMIN,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });