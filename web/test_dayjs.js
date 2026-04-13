const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const d = new Date('2026-04-13T23:59:59.000Z');
console.log("Original Date string:", d.toISOString());
console.log("dayjs(d).tz('Asia/Tokyo'):", dayjs(d).tz('Asia/Tokyo').format('MM/DD HH:mm'));
console.log("dayjs.utc(d):", dayjs.utc(d).format('MM/DD HH:mm'));
