import { PrismaClient } from "../generated-client/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "AdminOtp", "PinAttempt", "Player", "Team" RESTART IDENTITY CASCADE;'
  );
  console.log("Database cleared: Team, Player, PinAttempt, AdminOtp");
}

main()
  .catch((err) => {
    console.error("Failed to clear database", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
