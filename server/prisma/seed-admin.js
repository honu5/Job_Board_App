// prisma/seed-admin.js
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';

async function main() {
  const email = 'admin@example.com';
  const password = await bcrypt.hash('Admin#123', 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log('Promoted existing user to ADMIN');
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email,
        password,
        role: 'ADMIN',
      },
    });
    console.log('Created ADMIN user');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => prisma.$disconnect());
