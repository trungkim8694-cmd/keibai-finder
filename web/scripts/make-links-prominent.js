const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Making Backlinks more prominent in the article content...');
  
  const slug = encodeURIComponent('競売不動産の占有者問題と法的リスク');
  
  const content_vi = `
# Cảnh báo rủi ro: Vấn đề người cư trú và pháp lý khi mua nhà đấu giá (Keibai) ⚠️

Mua nhà đấu giá Nhật Bản có thể giúp bạn tiết kiệm hàng tỷ đồng, nhưng cái giá phải trả có thể rất đắt nếu bạn không hiểu về **rủi ro cư trú** và **pháp lý**. 💡

---

### 1. Vấn đề người đang cư trú (Occupants) 🏠

Khác với mua bán thông thường, nhà đấu giá không được "bàn giao nhà trống".

- **Chủ cũ vẫn đang ở:** Họ có thể không có chỗ ở mới và từ chối rời đi.
- **Người thuê nhà:** Một số người thuê có quyền cư trú hợp pháp.

💡 **Lời khuyên:** Hãy đọc kỹ "Báo cáo hiện trạng" trong bộ hồ sơ tòa án để biết ai đang ở trong nhà.

---

### 2. Lệnh bàn giao và Cưỡng chế thi hành (Eviction) ⚖️

Nếu người ở không chịu đi, bạn phải nhờ đến pháp luật:

- **Lệnh bàn giao (Hikihodashi Meirei):** Tòa án ra lệnh cho người ở phải dọn đi.
- **Cưỡng chế thi hành:** Đội cưỡng chế sẽ đến dọn đồ đạc ra ngoài.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Trước khi đặt thầu, hãy kiểm tra mức độ chênh lệch giá và rủi ro tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

---

### 3. Nợ phí quản lý (Mansion Management Fees) 💰

Đối với căn hộ chung cư (Mansion), rủi ro lớn nhất là nợ phí quản lý của chủ cũ.

- Bạn **phải trả thay** toàn bộ số nợ này theo luật Nhật Bản.
- Hãy kiểm tra vị trí và đặc điểm khu vực tại:
> **👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

### Tổng kết: Đừng để "giá rẻ" đánh lừa 🛡️

Luôn giữ một khoản dự phòng rủi ro khoảng 10-15% giá trị nhà.

---
🚀 **BẮT ĐẦU TÌM KIẾM CƠ HỘI AN TOÀN:**
Truy cập ngay **[Keibai Finder Home](/)** để tìm những căn nhà đã được AI lọc bỏ rủi ro pháp lý!
`;

  const content_ja = `
# 競売不動産の落札後に潜む「占有者問題」と「法的リスク」の徹底解説 ⚠️

不動産競売は市場価格より安く購入できる反面、特有のリスクが存在します。 💡

---

### 1. 占有者問題：誰が住んでいるのか？ 🏠

- **自己占有**: 前の所有者が住んでいるケース。
- **第三者占有**: 賃借人などが居住しているケース。

💡 **対策:** 「現況調査報告書」で占有者の属性を確認しましょう。

---

### 2. 強制執行と引渡命令 ⚖️

占有者が退去しない場合、法的手段が必要になります。

> 📊 **投資判断のサポートツール:** 
> 落札価格に強制執行費用を含めても利益が出るか確認しましょう。
> **👉 [市場分析ダッシュボード](/insights)**

---

### 3. 滞納管理費の承継義務 💰

マンション落札時は、前所有者の滞納管理費を支払う義務があります。

- 周辺の資産価値や需要を調べるにはこちら：
> **👉 [エリア分析マップ](/area-map)**

---

**「安さ」の裏にある「リスク」を正しくコントロールしましょう。**

---
🚀 **安全な物件探しをスタート:**
**[Keibai Finder TOP](/)** でAIが選別した優良物件をチェック！
`;

  await prisma.dailyDigest.update({
    where: { slug },
    data: {
      content_vi,
      content_ja,
    },
  });

  console.log('Backlinks are now highly visible with icons and bold styling.');
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
