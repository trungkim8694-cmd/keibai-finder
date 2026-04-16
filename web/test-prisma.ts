import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const allProperties = await prisma.property.count({ where: { status: 'ACTIVE' } });
  const landCount = await prisma.property.count({ where: { status: 'ACTIVE', property_type: '土地' } });
  console.log(`Total: ${allProperties}, Land: ${landCount}`);
}
main().catch(console.error).finally(() => prisma.$disconnect())
