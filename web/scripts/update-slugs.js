const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const mapping = {
  '%E4%B8%8D%E5%8B%95%E7%94%A3%E7%AB%B6%E5%A3%B2%E3%81%AE%E5%9F%BA%E7%A4%8E%E7%9F%A5%E8%AD%98-A%E3%81%8B%E3%82%89Z%E3%81%BE%E3%81%A7': 'keibai-guide-a-to-z',
  '%E4%B8%8D%E5%8B%95%E7%94%A3%E7%AB%B6%E5%A3%B2%E3%81%AE5%E5%A4%A7%E3%83%AA%E3%82%B9%E3%82%AF%E3%81%A8%E5%9B%9E%E9%81%BF%E7%AD%96-%E5%8D%A0%E6%9C%89%E8%80%85%E3%83%BB%E5%BB%BA%E7%89%A9%E3%83%80%E3%83%A1%E3%83%BC%E3%82%B8': 'top-5-keibai-risks',
  '%E7%AB%B6%E5%A3%B2-Keibai-%E3%81%A8%E5%85%AC%E5%A3%B2-Koubai-%E3%81%AE%E9%81%95%E3%81%84%E5%BE%B9%E5%BA%95%E8%A7%A3%E8%AA%AC': 'keibai-vs-koubai-differences',
  '%E5%A4%96%E5%9B%BD%E4%BA%BA%E3%81%AB%E3%81%8A%E3%81%99%E3%81%99%E3%82%81%E3%81%AE%E6%97%A5%E6%9C%AC%E4%B8%8D%E5%8B%95%E7%94%A3%E7%AB%B6%E5%A3%B2%E3%82%B5%E3%82%A4%E3%83%88TOP4-%E4%BF%A1%E9%A0%BC%E3%81%A7%E3%81%8D%E3%82%8B%E6%83%85%E5%A0%B1%E6%BA%90': 'top-4-japan-auction-sites',
  '%E5%A4%96%E5%9B%BD%E4%BA%BA%E3%81%A7%E3%82%82%E6%97%A5%E6%9C%AC%E3%81%AE%E4%B8%8D%E5%8B%95%E7%94%A3%E7%AB%B6%E5%A3%B2%E3%81%AB%E5%8F%82%E5%8A%A0%E3%81%A7%E3%81%8D%E3%82%8B%EF%BC%9F%E6%9D%A1%E4%BB%B6%E3%81%A8%E6%B3%A8%E6%84%8F%E7%82%B9%E3%82%92%E5%BE%B9%E5%BA%95%E8%A7%A3%E8%AA%AC': 'japan-auction-guide-for-foreigners',
  '%E8%90%BD%E6%9C%AD%E5%BE%8C%E3%81%AE%E5%BC%95%E6%B8%A1%E5%91%BD%E4%BB%A4%E3%81%A8%E5%BC%B7%E5%88%B6%E5%9F%B7%E8%A1%8C-%E6%98%8E%E6%B8%A1%E3%81%97%E3%81%AE%E5%AE%8C%E5%85%A8%E3%82%AC%E3%82%A4%E3%83%89': 'eviction-and-handover-process-guide',
  '%E7%AB%B6%E5%A3%B2%E7%89%A9%E4%BB%B6%E8%90%BD%E6%9C%AD%E5%BE%8C%E3%81%AE%E3%83%AA%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0%E8%B2%BB%E7%94%A8%E7%9B%AE%E5%AE%89%E3%81%A8%E4%BA%88%E7%AE%97%E3%81%AE%E7%AB%8B%E3%81%A6%E6%96%B9%20%F0%9F%8F%A0': 'keibai-renovation-budgeting',
  '%E5%AE%9F%E4%BE%8B%E7%B4%B9%E4%BB%8B-%E5%8D%83%E8%91%89%E7%9C%8C%E5%9C%A8%E4%BD%8FH%E3%81%95%E3%82%93%E3%81%AE%E3%80%8C0%E5%86%86%E7%A9%BA%E3%81%8D%E5%AE%B6%E3%80%8D%E5%86%8D%E7%94%9F%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%20%F0%9F%8F%A0': 'case-study-chiba-akiya-zero-yen',
  '%E3%83%97%E3%83%AD%E3%81%8C%E6%95%99%E3%81%88%E3%82%8B%E3%80%8C%E8%B2%B7%E3%81%A3%E3%81%A6%E3%81%AF%E3%81%84%E3%81%91%E3%81%AA%E3%81%84%E3%80%8D%E7%AB%B6%E5%A3%B2%E7%89%A9%E4%BB%B6%E3%81%AE%E3%83%AC%E3%83%83%E3%83%89%E3%83%95%E3%83%A9%E3%83%83%E3%82%B0%20%F0%9F%9A%A9': 'avoid-these-keibai-red-flags',
  '%E7%AB%B6%E5%A3%B2%E4%B8%8D%E5%8B%95%E7%94%A3%E3%81%AE%E5%8D%A0%E6%9C%89%E8%80%85%E5%95%8F%E9%A1%8C%E3%81%A8%E6%B3%95%E7%9A%84%E3%83%AA%E3%82%B9%E3%82%AF': 'occupancy-and-legal-risks-guide',
  '%E5%A4%A7%E9%98%AA%E3%81%AE%E9%AB%98%E7%B4%9A%E3%83%9E%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%92%E5%B8%82%E5%A0%B4%E4%BE%A1%E6%A0%BC%E3%82%88%E3%82%8A2500%E4%B8%87%E5%86%86%E5%AE%89%E3%81%8F%E8%90%BD%E6%9C%AD%E3%81%97%E3%81%9FT%E3%81%95%E3%82%93%E3%81%AE%E6%88%90%E5%8A%9F%E6%B3%95%E5%89%87%20%F0%9F%8F%99%EF%B8%8F': 'case-study-osaka-luxury-mansion',
  '%E4%B8%8D%E5%8B%95%E7%94%A3%E7%AB%B6%E5%A3%B2%E3%81%A730%E3%83%91%E3%83%BC%E3%82%BB%E3%83%B3%E3%83%88%E5%AE%89%E3%81%8F%E8%B3%BC%E5%85%A5%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95': 'how-to-buy-keibai-30-percent-off',
  '%E5%8D%A0%E6%9C%89%E8%80%85%E5%95%8F%E9%A1%8C%E3%82%92%E5%B9%B3%E5%92%8C%E7%9A%84%E3%81%AB%E8%A7%A3%E6%B1%BA%E3%81%97%E3%81%9FM%E3%81%95%E3%82%93%E3%81%AE%E5%AE%9F%E9%8C%B2-%E7%AB%B6%E5%A3%B2%E3%81%AE%E3%80%8C%E6%9C%80%E5%A4%A7%E3%81%AE%E6%81%90%E6%80%96%E3%80%8D%E3%82%92%E5%85%8B%E6%9C%8D%E3%81%99%E3%82%8B%E6%96%B9%E6%B3%95%20%F0%9F%A4%9D': 'case-study-peaceful-handover-tokyo',
  '%E4%BA%AC%E9%83%BD%E3%81%AE%E5%8F%A4%E6%B0%91%E5%AE%B6%E3%82%92%E7%AB%B6%E5%A3%B2%E3%81%A7%E8%90%BD%E6%9C%AD%E3%81%97%E6%B0%91%E6%B3%8A%E3%83%93%E3%82%B8%E3%83%8D%E3%82%B9%E3%82%92%E6%88%90%E5%8A%9F%E3%81%95%E3%81%9B%E3%81%9F%E8%8B%A5%E6%89%8B%E8%B5%B7%E6%A5%AD%E5%AE%B6%E3%81%AE%E5%AE%9F%E4%BE%8B%20%F0%9F%8F%AE': 'case-study-kyoto-machiya-minpaku',
  '%E5%A4%B1%E6%95%97%E3%81%8B%E3%82%89%E5%AD%A6%E3%81%B6%E7%AB%B6%E5%A3%B2%E6%8A%95%E8%B3%87-%E3%80%8C%E5%AE%89%E3%81%95%E3%80%8D%E3%81%AB%E7%9B%AE%E3%81%8C%E7%9C%A9%E3%81%BF%E8%AA%BF%E6%9F%BB%E3%82%92%E6%80%A0%E3%81%A3%E3%81%9FB%E3%81%95%E3%82%93%E3%81%AE%E6%95%99%E8%A8%93%20%E2%9A%A0%EF%B8%8F': 'lessons-from-keibai-investment-failure',
  '%E3%80%902026%E5%B9%B44%E6%9C%8826%E6%97%A5%E3%80%91%E4%BB%8A%E6%97%A5%E3%81%AE%E7%AB%B6%E5%A3%B2%E4%B8%8D%E5%8B%95%E7%94%A3%E3%83%87%E3%82%A4%E3%83%AA%E3%83%BC%E3%83%BB%E3%83%80%E3%82%A4%E3%82%B8%E3%82%A7%E3%82%B9%E3%83%88%EF%BC%9A%E7%9C%A0%E3%82%8C%E3%82%8B%E8%B3%87%E7%94%A3%E3%82%92%E8%A6%9A%E9%86%92%E3%81%95%E3%81%9B%E3%82%8B%E3%83%81%E3%83%A3%E3%83%B3%E3%82%B9%EF%BC%81': 'daily-digest-2026-04-26',
  'top-deals-2026-05-09-2119': 'top-deals-2026-05-09'
};

async function main() {
  console.log('Migrating Slugs and creating Redirects...');

  for (const [oldSlug, newSlug] of Object.entries(mapping)) {
    const article = await prisma.dailyDigest.findUnique({
      where: { slug: oldSlug }
    });

    if (article) {
      console.log(`Updating: ${oldSlug} -> ${newSlug}`);
      
      // 1. Update DailyDigest
      await prisma.dailyDigest.update({
        where: { id: article.id },
        data: {
          slug: newSlug,
          previousSlugs: {
            push: oldSlug
          }
        }
      });

      // 2. Create Redirect record for /blogs/ and /insights/
      const categories = ['GUIDE', 'CAUTION', 'MARKET_REPORT'];
      const basePath = (article.category === 'MARKET_REPORT') ? '/insights' : '/blogs';
      
      await prisma.redirect.upsert({
        where: { oldPath: `${basePath}/${oldSlug}` },
        update: { newPath: `${basePath}/${newSlug}` },
        create: {
          oldPath: `${basePath}/${oldSlug}`,
          newPath: `${basePath}/${newSlug}`,
          statusCode: 301
        }
      });
      
      // Also handle URL encoded vs decoded redirects just in case
      const decodedOldSlug = decodeURIComponent(oldSlug);
      if (decodedOldSlug !== oldSlug) {
        await prisma.redirect.upsert({
          where: { oldPath: `${basePath}/${decodedOldSlug}` },
          update: { newPath: `${basePath}/${newSlug}` },
          create: {
            oldPath: `${basePath}/${decodedOldSlug}`,
            newPath: `${basePath}/${newSlug}`,
            statusCode: 301
          }
        });
      }
    }
  }

  console.log('Slug migration complete.');
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
