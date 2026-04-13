const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();
async function run() {
  const p = await prisma.property.findUnique({ where: { sale_unit_id: '00000025168' } });
  console.log("DB bid_end_date raw:", p.bid_end_date);
  console.log("DB bid_end_date ISO:", p.bid_end_date.toISOString());
  console.log("dayjs local format:", dayjs(p.bid_end_date).format('YYYY-MM-DD HH:mm:ss'));
  console.log("dayjs Tokyo format:", dayjs(p.bid_end_date).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss'));
}
run();
