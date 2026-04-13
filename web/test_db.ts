import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.property.findUnique({
    where: { sale_unit_id: '00000025250' },
    select: { prefecture: true, city: true, address: true, property_type: true }
  });
  console.log("DB Property:", p);
}
main().catch(console.error).finally(() => prisma.$disconnect());
