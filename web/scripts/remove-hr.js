const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Removing horizontal rules and adding whitespace for better flow...');
  
  const slugs = [
    encodeURIComponent('不動産競売で30パーセント安く購入する方法'),
    encodeURIComponent('競売不動産の占有者問題と法的リスク')
  ];

  for (const slug of slugs) {
    const article = await prisma.dailyDigest.findUnique({ where: { slug } });
    if (!article) continue;

    // Remove --- and replace with double newline
    const clean_vi = article.content_vi.replace(/\n---\n/g, '\n\n\n');
    const clean_ja = article.content_ja.replace(/\n---\n/g, '\n\n\n');

    await prisma.dailyDigest.update({
      where: { slug },
      data: {
        content_vi: clean_vi,
        content_ja: clean_ja
      }
    });
  }

  console.log('Horizontal rules removed. Spacing improved.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
