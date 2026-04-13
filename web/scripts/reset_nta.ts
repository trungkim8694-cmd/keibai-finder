import { prisma } from '../src/lib/prisma';
async function main() {
   const del = await prisma.property.deleteMany({ where: { source_provider: 'NTA' } });
   console.log(`[Reset NTA] Deleted ${del.count} properties.`);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
