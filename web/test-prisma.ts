import "dotenv/config";
import { prisma } from './src/lib/prisma';

async function main() {
  const allProperties = await prisma.property.count({ where: { status: 'ACTIVE' } });
  const landCount = await prisma.property.count({ where: { status: 'ACTIVE', property_type: '土地' } });
  console.log(`Total: ${allProperties}, Land: ${landCount}`);
}
main().catch(console.error).finally(() => prisma.$disconnect())
