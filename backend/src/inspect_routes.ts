import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const routes = await prisma.route.findMany({
    include: { stops: true }
  });
  console.log(JSON.stringify(routes, null, 2));
}

main().finally(() => prisma.$disconnect());
