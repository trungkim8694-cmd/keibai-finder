import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Wiping all BIT properties...");
    const res = await prisma.property.deleteMany({
        where: {
            source_provider: 'BIT'
        }
    });

    // Let's also enforce NTA source_provider for everything else, just in case (optional)
    
    console.log(`[BIT-Reset] Deleted old data | Scraped 0 new properties. Deleted ${res.count} rows.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
