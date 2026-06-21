const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Load environment variables
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const connectionString = process.env.DATABASE_URL;
console.log('Using connection URL:', connectionString ? '(defined)' : '(undefined)');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'trungkim8694@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error(`User with email "${email}" not found in database. Make sure you have logged in at least once on http://localhost:3000/ !`);
    return;
  }
  
  console.log('Found user:', user.id, user.name);

  // Kanto region prefectures
  const kanto = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県'];

  // Upsert AgencyProfile for TQC
  const profile = await prisma.agencyProfile.upsert({
    where: { userId: user.id },
    update: {
      companyName: 'TQC株式会社',
      licenseNumber: '東京都知事 (1) 第102345号',
      phone: '03-6907-1219',
      email: 'info@tqc-jp.com',
      website: 'https://tqc-jp.com/',
      prefectures: kanto,
      description: 'TQC株式会社は、競売不動産・公売不動産の売買、仲介、コンサルティングサービスを提供する専門企業です。関東全域（東京、神奈川、埼玉、千葉など）の物件に対応し、お客様の安心安全な不動産取引をサポートいたします。',
      isVerified: true
    },
    create: {
      userId: user.id,
      companyName: 'TQC株式会社',
      licenseNumber: '東京都知事 (1) 第102345号',
      phone: '03-6907-1219',
      email: 'info@tqc-jp.com',
      website: 'https://tqc-jp.com/',
      prefectures: kanto,
      description: 'TQC株式会社は、競売不動産・公売不動産の売買、仲介、コンサルティングサービスを提供する専門企業です。関東全域（東京、神奈川、埼玉、千葉など）の物件に対応し、お客様の安心安全な不動産取引をサポートいたします。',
      isVerified: true
    }
  });

  // Ensure user's role is AGENCY
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'AGENCY' }
  });

  console.log('Successfully created/updated TQC agency profile:', profile);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
