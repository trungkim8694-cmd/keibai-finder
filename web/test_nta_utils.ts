import { prisma } from './src/lib/prisma';
import { extractTotalArea } from './src/lib/utils';

async function main() {
    const properties = await prisma.property.findMany({
        where: { source_provider: 'NTA' },
        select: { sale_unit_id: true, raw_display_data: true, property_type: true },
        take: 5
    });
    
    console.log("=== NTA Area Extraction Test ===\n");
    for (const p of properties) {
       const parsed = typeof p.raw_display_data === 'string' ? JSON.parse(p.raw_display_data) : p.raw_display_data;
       let rawVal = "N/A";
       if (parsed && typeof parsed === 'object') {
           const overview = parsed.overview || {};
           const details = parsed.details || {};
           rawVal = overview['面積（地積）合計'] || details['面積（登記簿表示内容）'] || details['床面積（登記簿表示内容）'] || "None";
       }
       
       const area = extractTotalArea(p.raw_display_data, p.property_type || 'Unknown');
       console.log(`[NTA-Data] ID: ${p.sale_unit_id}\nRaw String: ${rawVal}\nCleaned Value: ${area}\n--------------------------`);
    }
}

main().finally(() => prisma.$disconnect());
