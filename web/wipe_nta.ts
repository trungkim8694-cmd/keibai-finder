import { prisma } from './src/lib/prisma';
async function main() {
   // Delete NTA records. Cascade delete is handled by Prisma schema for relation arrays.
   const del = await prisma.property.deleteMany({ where: { source_provider: 'NTA' } });
   console.log(`[Wipe Data] Deleted ${del.count} NTA properties from the database.`);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
