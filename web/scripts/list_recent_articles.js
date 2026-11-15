const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');

// Read env directly
const envContent = fs.readFileSync('C:/keibai-web/.env.local', 'utf8');
let dbUrl = '';
envContent.split('\n').forEach(line => {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  }
});

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const articles = await prisma.dailyDigest.findMany({
    select: { id: true, slug: true, category: true, title_ja: true, publishDate: true },
    orderBy: { publishDate: 'desc' },
    take: 20
  });
  console.log('Total recent articles:', articles.length);
  articles.forEach(a => console.log(a.category + ' -> ' + a.slug + ' : ' + (a.title_ja ? a.title_ja.substring(0, 50) : '')));
  await prisma.$disconnect();
  await pool.end();
}
check();
