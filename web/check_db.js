const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const stats = await prisma.property.groupBy({
    by: ['prefecture'],
    where: { status: 'ACTIVE' },
    _count: { _all: true },
    orderBy: { _count: { prefecture: 'desc' } }
  });
  console.log(stats);
}
main().catch(console.error).finally(() => prisma.$disconnect());
