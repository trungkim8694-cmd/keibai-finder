const path = require('path');
const fs = require('fs');

const webModules = path.resolve(__dirname, '../web/node_modules');
const { Client } = require(path.join(webModules, 'pg'));
const turf = require(path.join(webModules, '@turf/boolean-point-in-polygon')).default || require(path.join(webModules, '@turf/boolean-point-in-polygon'));
const { point } = require(path.join(webModules, '@turf/helpers'));

// Load environment variables
require(path.join(webModules, 'dotenv')).config({ path: path.resolve(__dirname, '../web/.env.local') });
require(path.join(webModules, 'dotenv')).config({ path: path.resolve(__dirname, '../web/.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const PREF_REGEX = new RegExp(`(${PREFECTURES.join('|')})`);

// Calculate 2D Bounding Box for GeoJSON polygon/multipolygon
function getBBox(coords, type) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function walk(c) {
    if (typeof c[0] === 'number') {
      if (c[0] < minX) minX = c[0];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[1] > maxY) maxY = c[1];
    } else {
      for (const sub of c) walk(sub);
    }
  }
  walk(coords);
  return [minX, minY, maxX, maxY];
}

async function main() {
  console.log("=== BẮT ĐẦU CHUẨN HOÁ PREFECTURE CHO AUCTION RESULT ===");
  
  // 1. Load GeoJSON features and precompute bounding boxes
  const geojsonPath = path.resolve(__dirname, '../japan_prefectures.geojson');
  const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  const prefFeatures = geojson.features.map(f => ({
    name: f.properties.nam_ja,
    feature: f,
    bbox: getBBox(f.geometry.coordinates, f.geometry.type)
  }));
  console.log(`Đã nạp ${prefFeatures.length} ranh giới tỉnh từ GeoJSON.`);

  // 2. Connect to database
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  // 3. Load city -> prefecture dictionary from RealEstateCompany and Property
  const cityDict = new Map();
  const cityRes = await client.query(`
    SELECT DISTINCT city, prefecture FROM "RealEstateCompany" WHERE city IS NOT NULL AND prefecture IS NOT NULL
    UNION
    SELECT DISTINCT city, prefecture FROM "Property" WHERE city IS NOT NULL AND prefecture IS NOT NULL;
  `);
  for (const r of cityRes.rows) {
    cityDict.set(r.city.trim(), r.prefecture.trim());
  }
  console.log(`Đã xây dựng từ điển ${cityDict.size} thành phố -> tỉnh.`);

  // 4. Fetch all AuctionResult records needing prefecture
  console.log("Đang tải dữ liệu AuctionResult...");
  const res = await client.query(`
    SELECT id, address, lat, lng, raw_data->>'nearest_station' as nearest_station 
    FROM "AuctionResult";
  `);
  const rows = res.rows;
  console.log(`Tổng số bản ghi cần phân loại: ${rows.length}`);

  let matchByText = 0;
  let matchByCity = 0;
  let matchByGeo = 0;
  let unmatched = 0;

  const updates = [];

  for (const r of rows) {
    let pref = null;

    // Strategy 1: Match exact prefecture in address
    if (r.address) {
      const match = r.address.match(PREF_REGEX);
      if (match) {
        pref = match[1];
        matchByText++;
      } else {
        // Strategy 2: Match city in address
        for (const [city, p] of cityDict) {
          if (r.address.startsWith(city) || r.address.includes(city)) {
            pref = p;
            matchByCity++;
            break;
          }
        }
      }
    }

    // Strategy 3: Match by lat/lng Point-In-Polygon
    if (!pref && r.lat && r.lng) {
      const lng = r.lng;
      const lat = r.lat;

      // Fast BBox check first
      for (const pf of prefFeatures) {
        const [minX, minY, maxX, maxY] = pf.bbox;
        if (lng >= minX && lng <= maxX && lat >= minY && lat <= maxY) {
          const pt = point([lng, lat]);
          if (turf(pt, pf.feature)) {
            pref = pf.name;
            matchByGeo++;
            break;
          }
        }
      }
    }

    if (pref) {
      updates.push({ id: r.id, pref });
    } else {
      unmatched++;
    }
  }

  console.log(`Kết quả phân loại:`);
  console.log(`- Trùng khớp qua chuỗi địa chỉ có tên Tỉnh: ${matchByText}`);
  console.log(`- Trùng khớp qua từ điển Thành phố: ${matchByCity}`);
  console.log(`- Trùng khớp chuẩn xác qua Tọa độ Geo: ${matchByGeo}`);
  console.log(`- Tổng số đã tìm được Tỉnh: ${updates.length} / ${rows.length} (${((updates.length / rows.length) * 100).toFixed(2)}%)`);
  console.log(`- Chưa khớp: ${unmatched}`);

  // 5. Batch update to PostgreSQL
  console.log("Đang ghi dữ liệu hàng loạt vào PostgreSQL...");
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    
    // Construct multi-values SQL
    const valuePlaceholders = chunk.map((_, idx) => `($${idx * 2 + 1}::text, $${idx * 2 + 2}::text)`).join(', ');
    const flatParams = [];
    chunk.forEach(item => {
      flatParams.push(item.id, item.pref);
    });

    const query = `
      UPDATE "AuctionResult" AS ar
      SET prefecture = v.pref
      FROM (VALUES ${valuePlaceholders}) AS v(id, pref)
      WHERE ar.id = v.id;
    `;

    await client.query(query, flatParams);
    process.stdout.write(`\rĐã cập nhật: ${Math.min(i + CHUNK_SIZE, updates.length)} / ${updates.length}`);
  }

  console.log("\nHOÀN THÀNH CẬP NHẬT PREFECTURE 100%!");
  await client.end();
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
