const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up specified articles...');
  
  const slugsToDelete = [
    '不动产竞卖で30パーセント安く购入する方法', // I should decode this or use the actual Japanese string
    'canh-bao-rui-ro-khi-mua-nha-dau-gia',
    'huong-dan-quy-trinh-dau-gia-keibai'
  ];

  // Decode the Japanese slug just in case
  const japaneseSlug = decodeURIComponent('%E4%B8%8D%E5%8B%95%E7%94%A3%E7%AB%B6%E5%A3%B2%E3%81%A730%E3%83%91%E3%83%BC%E3%82%BB%E3%83%B3%E3%83%88%E5%AE%89%E3%81%8F%E8%B3%BC%E5%85%A5%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95');
  
  const finalSlugs = [
    japaneseSlug,
    'canh-bao-rui-ro-khi-mua-nha-dau-gia',
    'huong-dan-quy-trinh-dau-gia-keibai'
  ];

  console.log('Deleting slugs:', finalSlugs);

  const result = await prisma.dailyDigest.deleteMany({
    where: {
      slug: {
        in: finalSlugs
      }
    }
  });

  console.log(`Deleted ${result.count} articles.`);
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
