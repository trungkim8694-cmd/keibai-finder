import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.resolve(__dirname, '../../.antigravity/research/parsed_properties.json');
  console.log(`Đang đọc file JSON từ: ${jsonPath}`);

  if (!fs.existsSync(jsonPath)) {
    console.error("Không tìm thấy file JSON!");
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const properties = JSON.parse(rawData);

  console.log(`Bắt đầu Import ${properties.length} tài sản vào Database...`);

  for (const prop of properties) {
    const { sale_unit_id, court_name, property_type, starting_price, address } = prop;

    await prisma.property.upsert({
      where: { sale_unit_id },
      update: {
        starting_price: starting_price ? BigInt(starting_price) : null,
        address,
        property_type,
      },
      create: {
        sale_unit_id,
        court_name,
        property_type,
        address,
        starting_price: starting_price ? BigInt(starting_price) : null,
      }
    });
    console.log(` Đã lưu/cập nhật tài sản: ${sale_unit_id}`);
  }

  console.log('✅ Hoàn tất Import!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
