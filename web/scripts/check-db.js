const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const slug = encodeURIComponent('競売-Keibai-と公売-Koubai-の違い徹底解説');
  const article = await prisma.dailyDigest.findUnique({ where: { slug } });
  if (article) {
    console.log('--- CONTENT JA ---');
    console.log(article.content_ja);
    console.log('--- END ---');
  } else {
    console.log('Article not found');
  }
}

main().finally(() => prisma.$disconnect());
