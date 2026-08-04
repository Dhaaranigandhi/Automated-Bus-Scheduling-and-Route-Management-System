import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestDriver = await prisma.driver.findFirst({
    orderBy: { id: 'desc' },
    include: { user: true },
  });

  const latestUser = await prisma.user.findFirst({
    orderBy: { id: 'desc' },
  });

  console.log('--- DB Investigation ---');
  console.log('Latest Driver:', JSON.stringify(latestDriver, null, 2));
  console.log('Latest User:', JSON.stringify(latestUser, null, 2));
  
  if (latestDriver && latestUser) {
    console.log('1. Is a new User record created?', latestUser.createdAt >= latestDriver.createdAt ? 'Yes' : 'Maybe not');
    console.log('2. What is the User.id?', latestUser.id);
    console.log('3. What is the Driver.userId?', latestDriver.userId);
    console.log('4. Are Driver.userId and User.id equal?', latestDriver.userId === latestUser.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
