import 'dotenv/config';
import { prisma } from './src/lib/prisma';

function normalizeCategory(rawVal: string | null | undefined): string {
    if (!rawVal) return "その他";
    const valLower = rawVal.toLowerCase();
    
    // Khối 1: 戸建て
    if (valLower.includes("建物") || valLower.includes("家屋") || valLower.includes("戸建")) {
        return "戸建て";
    }
    // Khối 2: マンション
    if (valLower.includes("区分所有") || valLower.includes("マンション")) {
        return "マンション";
    }
    // Khối 3: 土地 (Phải thỏa điều kiện không bị match bởi '建物' ở trên)
    if (valLower.includes("宅地")) {
        return "土地";
    }
    // Khối 4: 農地
    if (valLower.includes("田") || valLower.includes("畑") || valLower.includes("農地")) {
        return "農地";
    }
    // Khối 5: その他 (山林, 原野, 雑種地, v.v.)
    return "その他";
}

async function main() {
    console.log("Fetching NTA properties for Category Normalization...");
    const properties = await prisma.property.findMany({
        where: { source_provider: 'NTA' },
        select: { sale_unit_id: true, raw_display_data: true, property_type: true }
    });
    
    console.log(`Found ${properties.length} NTA properties. Begin loop...`);
    
    let updatedCount = 0;
    let fallbackCount = 0;
    
    for (const p of properties) {
        try {
            console.log(`[Processing] ID: ${p.sale_unit_id} (Current: ${p.property_type})`);
            
            let rawVal = null;
            if (p.raw_display_data && typeof p.raw_display_data === 'object') {
                const overview = (p.raw_display_data as any).overview || {};
                rawVal = overview["財産種別"] || overview["主たる地目"];
            } else if (p.property_type && p.property_type !== 'Unknown') {
                 // Fallback to property_type if raw_display_data isn't parsed into JSON (old test data)
                 rawVal = p.property_type;
            }
            
            const newCategory = normalizeCategory(rawVal);
            
            console.log(` ---> Raw: ${rawVal} => Normalized: ${newCategory}`);
            
            await prisma.property.update({
                where: { sale_unit_id: p.sale_unit_id },
                data: { 
                    property_type: newCategory
                }
            });
            console.log(` ---> Update SUCCESS`);
            updatedCount++;
            if (newCategory === 'その他') fallbackCount++;
        } catch (err: any) {
            console.error(` ---> Update FAILED for ID: ${p.sale_unit_id}: ${err.message}`);
        }
    }
    
    console.log(`\n====================================`);
    console.log(`✅ DONE. Updated ${updatedCount} properties.`);
    console.log(`Tag "その他" applied to ${fallbackCount} properties.`);
    console.log(`====================================\n`);
}

main()
  .catch(e => {
    console.error("FATAL ERROR:", e);
  })
  .finally(async () => {
    console.log("Disconnecting Prisma...");
    await prisma.$disconnect();
  });
