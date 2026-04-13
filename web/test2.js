const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const data = await prisma.property.findMany({ take: 3 });
  console.log('Props:', data.map(p => p.prefecture));
  // check getProperties Action logic
  const formatted = data.map(p => ({
     sale_unit_id: p.sale_unit_id,
     prefecture: p.prefecture,
     city: p.city,
     thumbnailUrl: p.thumbnailUrl ? p.thumbnailUrl.replace('bit.sikkou.jp', 'www.bit.courts.go.jp') : null
  }));
  console.log('Formatted:', formatted);
}
run();
