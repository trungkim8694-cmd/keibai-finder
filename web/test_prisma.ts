import { prisma } from './src/lib/prisma';
import fs from 'fs';

async function main() {
  const p = await prisma.property.findFirst({
    where: { source_provider: 'NTA' },
    orderBy: { created_at: 'desc' }
  });
  fs.writeFileSync('output.txt', JSON.stringify({
    id: p?.sale_unit_id,
    images: p?.images,
    raw_display_data: p?.raw_display_data
  }, null, 2));
}
main().catch((e) => fs.writeFileSync('output.txt', 'error: ' + e));
