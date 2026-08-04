import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const routes = await prisma.route.findMany({ include: { stops: true } });
  
  for (const route of routes) {
    for (const stop of route.stops) {
      if (stop.stopOrder === 1 && (stop.stopName === 'Source Terminal' || stop.stopName === '')) {
        await prisma.routeStop.update({
          where: { id: stop.id },
          data: { stopName: route.startLocation }
        });
        console.log(`Updated Route ${route.id} start stop to ${route.startLocation}`);
      }
      if (stop.stopOrder === route.stops.length && (stop.stopName === 'Destination Terminal' || stop.stopName === '')) {
        await prisma.routeStop.update({
          where: { id: stop.id },
          data: { stopName: route.endLocation }
        });
        console.log(`Updated Route ${route.id} end stop to ${route.endLocation}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
