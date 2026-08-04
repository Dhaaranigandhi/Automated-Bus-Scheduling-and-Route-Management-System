import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findFirst();
  if (!driver) return;
  const driverId = driver.id;
  const performanceScore = 4.5; // From req.body (parseFloat in frontend)
  
  try {
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        performanceScore,
      },
    });
    console.log("Update succeeded:", updatedDriver);
  } catch (err: any) {
    console.log("Update failed:", err.message, err.stack);
  }
}

main().finally(() => prisma.$disconnect());
