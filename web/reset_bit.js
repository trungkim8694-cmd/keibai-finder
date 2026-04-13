const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
    console.log("Wiping all BIT properties...");
    const res = await prisma.property.deleteMany({
        where: {
            source_provider: 'BIT'
        }
    });
    
    // As the prompt also says, BIT records from the old parser had NULL source_provider originally
    const res2 = await prisma.property.deleteMany({
        where: {
            source_provider: null
        }
    });
    
    console.log(`[BIT-Reset] Deleted old data | Deleted ${res.count + res2.count} rows.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
