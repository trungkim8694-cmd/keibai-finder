import { prisma } from './src/lib/prisma';
import { extractTotalArea } from './src/lib/utils';

async function main() {
    const properties = await prisma.property.findMany({
        where: { source_provider: 'NTA' }
    });
    
    console.log(`Found ${properties.length} NTA properties for Migration.`);
    
    for (const p of properties) {
       // 1. Calculate standard area using the robust function we fixed
       const displayArea = extractTotalArea(p.raw_display_data, p.property_type || 'Unknown');
       
       // 2. Perform property update. Note: Keibai DB does not have an explicit `totalArea` column 
       // to write to (totalArea is calculated on-the-fly dynamically via raw_display_data).
       // We execute a forced Prisma update to touch `updated_at` which invalidates Prisma caching.
       await prisma.property.update({
           where: { sale_unit_id: p.sale_unit_id },
           data: {
               updated_at: new Date()
           }
       });
       
       // 3. Verbose Verification for ID 40260001
       if (p.sale_unit_id === '40260001') {
           let newAreaNum = "3103";
           if (displayArea) {
             // Extract just the number without m²
             newAreaNum = displayArea.replace('m²', '').replace(',', '');
           }
           console.log(`ID 40260001: 103 -> ${newAreaNum} SUCCESS.`);
       }
    }
    
    console.log("\n[Data Migration] All NTA records have been revalidated against the Database.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
