const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding demo logs...');
  
  const guide = await prisma.dailyDigest.upsert({
    where: { slug: 'huong-dan-quy-trinh-dau-gia-keibai' },
    update: {
      category: 'GUIDE'
    },
    create: {
      slug: 'huong-dan-quy-trinh-dau-gia-keibai',
      title_ja: '競売入札プロセスのガイド',
      title_vi: 'Hướng dẫn quy trình đấu giá Keibai từ A-Z',
      title_en: 'A-Z Guide for Keibai Auction Process',
      title_zh: 'Keibai 拍卖流程 A-Z 指南',
      content_ja: '# 競売プロセスの詳細\n\n1. 物件の検索\n2. 現場の確認...',
      content_vi: '# Hướng dẫn quy trình đấu giá Keibai\n\nĐây là hướng dẫn chi tiết về cách thức tham gia đấu giá bất động sản tại Nhật Bản...\n\n## Bước 1: Tìm kiếm tài sản\nSử dụng Keibai Finder để tìm các tài sản tiềm năng.\n\n## Bước 2: Kiểm tra hồ sơ (3 bộ tài liệu)\nCực kỳ quan trọng để hiểu tình trạng pháp lý.',
      content_en: '# Keibai Process Guide...',
      content_zh: '# Keibai 流程指南...',
      category: 'GUIDE',
      tags: ['guide', 'tutorial', 'newbie'],
    },
  });

  const caution = await prisma.dailyDigest.upsert({
    where: { slug: 'canh-bao-rui-ro-khi-mua-nha-dau-gia' },
    update: {
      category: 'CAUTION'
    },
    create: {
      slug: 'canh-bao-rui-ro-khi-mua-nha-dau-gia',
      title_ja: '競売不動産購入のリスク và 注意点',
      title_vi: 'Những rủi ro "chết người" khi mua nhà đấu giá Keibai',
      title_en: 'Deadly Risks in Keibai Property Purchase',
      title_zh: 'Keibai 房产购买中的致命风险',
      content_ja: '# リスク管理...',
      content_vi: '# Cảnh báo rủi ro khi mua nhà đấu giá\n\nKhông phải mọi tài sản Keibai đều là món hời...\n\n## Rủi ro 1: Cư dân không chịu rời đi\nĐây là vấn đề phổ biến nhất.\n\n## Rủi ro 2: Tình trạng nhà hư hỏng nặng\nBạn không được xem bên trong nhà trước khi đấu giá.',
      content_en: '# Risk Management...',
      content_zh: '# 风险管理...',
      category: 'CAUTION',
      tags: ['caution', 'risk', 'legal'],
    },
  });

  console.log('Seeded:', { guide_id: guide.id, caution_id: caution.id });
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
