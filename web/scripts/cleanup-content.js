const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up meta-labels from all blog articles...');

  const articles = await prisma.dailyDigest.findMany();

  const labelsToRemove = [
    /Case Study:\s*/gi,
    /【実例】\s*/gi,
    /Bối cảnh:\s*/gi,
    /Chiến thuật:\s*/gi,
    /Kết quả ngọt ngào:\s*/gi,
    /Giá trị rút ra:\s*/gi,
    /Cốt truyện:\s*/gi,
    /Lời khuyên từ chuyên gia:\s*/gi,
    /Ghi chú cho bạn về SEO:\s*/gi,
    /Ghi chú:\s*/gi,
    /Phù hợp với:\s*/gi,
    /Ưu điểm:\s*/gi,
    /Nhược điểm:\s*/gi,
    /Rủi ro:\s*/gi,
    /Cách phòng tránh:\s*/gi,
    /Bối cảnh\s+/gi,
    /Chiến thuật\s+/gi,
    /Kết quả\s+/gi,
    /Nhân vật:\s*/gi
  ];

  for (const article of articles) {
    let updated = false;
    const updateData = {};

    const clean = (text) => {
      if (!text) return text;
      let cleaned = text;
      labelsToRemove.forEach(regex => {
        cleaned = cleaned.replace(regex, '');
      });
      return cleaned;
    };

    const fields = ['content_ja', 'content_vi', 'content_en', 'content_zh', 'title_ja', 'title_vi', 'title_en', 'title_zh'];
    fields.forEach(field => {
      const original = article[field];
      const cleaned = clean(original);
      if (original !== cleaned) {
        updateData[field] = cleaned;
        updated = true;
      }
    });

    if (updated) {
      await prisma.dailyDigest.update({
        where: { id: article.id },
        data: updateData
      });
      console.log(`Cleaned: ${article.slug}`);
    }
  }

  console.log('Cleanup complete.');
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
