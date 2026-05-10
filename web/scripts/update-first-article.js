const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding prominent backlinks to the first SEO article...');
  
  const slug = encodeURIComponent('不動産競売で30パーセント安く購入する方法');
  
  const content_vi = `
# Làm thế nào để mua nhà đấu giá (Keibai) tại Nhật rẻ hơn 30% so với thị trường?

Đầu tư bất động sản đấu giá (Keibai) tại Nhật Bản đang trở thành một xu hướng hấp dẫn nhờ khả năng sở hữu nhà với mức giá thấp hơn đáng kể so với thị trường tự do. 🚀

---

### 1. Hiểu rõ về "Giá khởi điểm" (Starting Price) 💡

Mức giá khởi điểm thường thấp hơn thị trường từ **30% đến 40%**. 

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> So sánh ngay mức giá đấu giá với giá trị thực tế của khu vực tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

---

### 2. Phân tích kỹ lưỡng "Bộ 3 tài liệu" (3点セット) 🔍

Bộ 3 tài liệu là nguồn tin duy nhất giúp bạn hiểu tình trạng ngôi nhà và pháp lý.

---

### 3. Sử dụng công cụ Keibai Finder để tính "Investment Gap" 📊

Chỉ số **MLIT Investment Gap** của chúng tôi giúp bạn biết mức độ chênh lệch giá.

- Hãy chọn những căn có chênh lệch trên 25%.
- Xem vị trí và nhu cầu thuê tại khu vực đó:
> **👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

### 4. Kiểm tra các rủi ro tiềm ẩn (Hidden Risks) ⚠️

Đừng quên kiểm tra nợ phí quản lý và quyền sử dụng đất. Bạn có thể tra cứu lịch sử giá tại:
> **👉 [Tra Cứu Giá Thực Tế](/trade-find)**

---

**Bạn đã sẵn sàng sở hữu bất động sản giá rẻ tại Nhật?**

🚀 Truy cập ngay **[Keibai Finder Home](/)** để không bỏ lỡ cơ hội tốt nhất!
`;

  const content_ja = `
# 日本の不動産競売で市場価格より30%安く購入する方法【保存版】 🚀

不動産競売（けいばい）で利益を出すための具体的なノウハウを公開します。

---

### 1. 基準価額と市場価格の「歪み」を狙う 💡

> 📊 **投資判断のサポートツール:** 
> 市場の歪み（価格乖離）が大きい物件をAIが厳選：
> **👉 [市場分析ダッシュボード](/insights)**

---

### 2. 「3点セット」をプロの視点で読み解く 🔍

---

### 3. Keibai Finderの「投資ギャップ」分析を活用する 📊

乖離率が25%以上の物件を優先的に調査しましょう。

- 周辺エリアの需要予測や賃料相場を確認：
> **👉 [エリア分析マップ](/area-map)**

---

### 4. 落札後のコスト（隠れた費用）を正確に算出する ⚠️

周辺の実際の取引事例を調べるにはこちら：
> **👉 [不動産取引価格検索](/trade-find)**

---

**あなたも競売で「賢い投資」を始めませんか？**

🚀 **[Keibai Finder TOP](/)** でお宝物件を今すぐチェック！
`;

  await prisma.dailyDigest.update({
    where: { slug },
    data: {
      content_vi,
      content_ja,
    },
  });

  console.log('Prominent backlinks added to the first article successfully.');
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
