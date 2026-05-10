const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Normalizing spacing to standard double newlines...');
  
  const slugs = [
    encodeURIComponent('不動産競売で30パーセント安く購入する方法'),
    encodeURIComponent('競売不動産の占有者問題と法的リスク'),
    encodeURIComponent('不動産競売の基礎知識-AからZまで'),
    encodeURIComponent('競売-Keibai-と公売-Koubai-の違い徹底解説')
  ];

  for (const slug of slugs) {
    const article = await prisma.dailyDigest.findUnique({ where: { slug } });
    if (!article) continue;

    // Clean up excessive newlines: Replace 3+ newlines with exactly 2
    const normalize = (text) => text.replace(/\n{3,}/g, '\n\n');

    await prisma.dailyDigest.update({
      where: { slug },
      data: {
        content_vi: normalize(article.content_vi),
        content_ja: normalize(article.content_ja),
        content_en: normalize(article.content_en),
        content_zh: normalize(article.content_zh)
      }
    });
  }

  console.log('Spacing normalized.');
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
