const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const props = await prisma.property.findMany({ select: { sale_unit_id: true, property_type: true, prefecture: true, city: true, status: true } });
  console.table(props);
}
main().catch(console.error).finally(() => prisma.$disconnect());
