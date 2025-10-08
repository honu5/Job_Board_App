import {prisma} from './db.js'

async function main() {
  await prisma.application.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.Client.deleteMany({});
  await prisma.revokedToken.deleteMany({});
  console.log("Database cleaned!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Disconnected from database.");
  });
