import { prisma } from './db.js';

async function main() {
  await prisma.profile.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.revokedToken.deleteMany({});
  await prisma.client.deleteMany({});

  await prisma.user.deleteMany({});

  console.log(" Database cleaned!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database.");
  });
