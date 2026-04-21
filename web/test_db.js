const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.property.count({
    where: {
      status: 'ACTIVE',
      line_name: 'IRいしかわ鉄道線'
    }
  });
  console.log("Count ACTIVE for IRいしかわ鉄道線:", c);

  const stats = await prisma.property.groupBy({
        by: ['line_name', 'nearest_station'],
        where: {
          status: 'ACTIVE',
          line_name: 'IRいしかわ鉄道線',
          nearest_station: { not: null }
        },
        _count: {
          _all: true
        }
      });
  console.log("Stats:", stats);
}
main().catch(console.error).finally(() => prisma.$disconnect());
