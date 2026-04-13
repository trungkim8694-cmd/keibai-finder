const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:3001';

test('1. Test Trang Chủ (Home Page) - Kiểm tra CCU Cache', async (t) => {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/`);
  const text = await res.text();
  const end = Date.now();

  assert.strictEqual(res.status, 200, 'Trang chủ phải trả về status 200');
  assert.ok(text.includes('Keibai Finder'), 'Phải chứa từ khóa trang web');
  
  console.log(`✅ [Trang Chủ] Load thành công. Thời gian phản hồi: ${end - start}ms`);
  if ((end - start) > 1000) {
    console.warn(`⚠️ Phản hồi hơi chậm (${end - start}ms). ISR Cache có thể chưa được kích hoạt lý tưởng.`);
  }
});

test('2. Test Router Hành Chính (Programmatic Area SEO)', async (t) => {
  const pref = encodeURIComponent('東京都');
  const city = encodeURIComponent('新宿区');
  
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/search/area/${pref}/${city}`);
  const text = await res.text();
  const end = Date.now();

  assert.strictEqual(res.status, 200, 'Trang Tỉnh/Thành phố phải trả về status 200');
  assert.ok(text.includes('東京都') || text.includes('新宿区'), 'Giao diện phải chứa text Tỉnh/Thành');
  
  console.log(`✅ [Router Area] Load thành công (${end - start}ms).`);
});

test('3. Test Router Ga Tàu (Programmatic Station SEO)', async (t) => {
  const line = encodeURIComponent('山手線');
  const station = encodeURIComponent('新宿');
  
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/search/station/${line}/${station}`);
  const text = await res.text();
  const end = Date.now();

  assert.strictEqual(res.status, 200, 'Trang Ga tàu phải trả về status 200');
  assert.ok(text.includes('山手線') || text.includes('新宿'), 'Giao diện phải chứa text Ga/Tuyến');
  
  console.log(`✅ [Router Station] Load thành công (${end - start}ms).`);
});

test('4. Test Auto Sitemap (sitemap.xml)', async (t) => {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  const text = await res.text();
  const end = Date.now();

  assert.strictEqual(res.status, 200, 'Sitemap phải hoạt động');
  assert.ok(text.includes('<urlset'), 'Định dạng XML phải chuẩn');
  
  console.log(`✅ [Sitemap XML] Load thành công (${end - start}ms). Data đã sẵn sàng cho Google.`);
});

test('5. Test Auto Robots (robots.txt)', async (t) => {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/robots.txt`);
  const text = await res.text();
  const end = Date.now();

  assert.strictEqual(res.status, 200, 'Robots.txt phải hoạt động');
  assert.ok(text.includes('User-Agent: *'), 'Phải chứa User Agent rule');
  
  console.log(`✅ [Robots Txt] Load thành công (${end - start}ms).`);
});
