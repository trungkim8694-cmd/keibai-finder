const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing Renovation Costs Guide following the Standard...');
  
  const slug = encodeURIComponent('競売物件落札後のリフォーム費用目安と予算の立て方 🏠');
  
  const content_ja = `
# 競売物件落札後のリフォーム費用はいくら？予算の立て方と節約のコツ 🏠

競売で物件を安く手に入れても、その後のリフォーム費用で予算オーバーしてしまっては本末転倒です。

日本の住宅事情に合わせたリフォーム費用の目安と、賢い予算の立て方を徹底解説します。 💡

### 1. リフォーム箇所別の費用相場（目安） 🛠️

まずは、一般的な箇所別の費用感を知っておきましょう。

- **壁紙・床の張り替え**: 50万〜100万円（家全体）
- **水回り（キッチン・バス・トイレ）**: 150万〜300万円
- **外壁・屋根塗装（戸建ての場合）**: 100万〜150万円
- **給排水管の更新**: 50万〜100万円

> 📊 **リフォーム後の価値を予測:** 
> 投資に見合うリフォーム規模を判断するには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. 物件タイプ別の総予算イメージ 💰

- **マンション (3LDK程度)**: 300万〜600万円。フルリノベーションなら800万円〜。
- **戸建て (築30年以上)**: 500万〜1,000万円。耐震補強や外装を含むと高額になります。

### 3. 予算オーバーを防ぐ3つの鉄則 ⚠️

1. **優先順位を決める**: 構造（雨漏り・配管）を最優先し、デザインは後回しにする。
2. **予備費を確保する**: 競売物件は中が見えないため、着工後に追加の不具合が見つかることが多々あります。総予算の10-20%は予備費として持ちましょう。
3. **補助金を活用する**: 断熱改修やバリアフリー化には、自治体の補助金が使える場合があります。

周辺エリアの売却相場を確認し、リフォーム予算の上限を決める：
**👉 [不動産取引価格検索](/trade-find)**

### 4. 投資としてのリフォーム戦略 📊

「自分が住むためのリフォーム」と「貸すためのリフォーム」は異なります。ターゲットに合わせた適切な設備投資を心がけましょう。

エリアごとの賃貸需要と家賃相場をチェック：
**👉 [エリア分析マップ](/area-map)**

---

**適切なリフォームは、物件の価値を最大化させる魔法です。**

🚀 **[Keibai Finder TOP](/)** でリフォーム後の利回りをシミュレーションしましょう！
`;

  const content_vi = `
# Chi phí sửa chữa nhà cũ tại Nhật: Dự toán ngân sách cải tạo sau khi trúng thầu Keibai 🏠

Mua được nhà giá rẻ qua đấu giá chỉ là bước đầu tiên. Để biến căn nhà đó thành nơi ở lý tưởng hoặc một tài sản cho thuê sinh lời, bạn cần một kế hoạch cải tạo (Renovation) thông minh. 💡

### 1. Báo giá tham khảo cho các hạng mục phổ biến 🛠️

Chi phí sửa chữa tại Nhật thường khá cao do chi phí nhân công. Dưới đây là các con số tham khảo:

- **Thay mới sàn và giấy dán tường (toàn nhà):** 500.000 - 1.000.000 Yên.
- **Cải tạo khu vực nước (Bếp, Nhà tắm, Toilet):** 1.500.000 - 3.000.000 Yên.
- **Sơn lại tường ngoài và mái nhà (nhà phố):** 1.000.000 - 1.500.000 Yên.
- **Hệ thống điện nước ngầm:** 500.000 - 1.000.000 Yên.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Tính toán lợi nhuận mục tiêu sau khi cải tạo tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Dự toán tổng ngân sách theo loại hình nhà 💰

- **Căn hộ Chung cư (Mansion):** Khoảng 3.000.000 - 6.000.000 Yên cho mức sửa chữa cơ bản. Nếu làm mới hoàn toàn (Full-renovation) có thể lên tới 8.000.000 Yên trở lên.
- **Nhà phố (Kominka):** Khoảng 5.000.000 - 10.000.000 Yên. Nhà cũ trên 30 năm thường cần gia cố thêm kết cấu chống động đất.

### 3. Bí quyết tiết kiệm và tránh phát sinh chi phí ⚠️

1. **Ưu tiên "Cốt lõi" trước:** Hãy sửa mái nhà, đường ống nước và điện trước khi lo đến màu sơn hay nội thất.
2. **Luôn có quỹ dự phòng:** Vì không được xem nhà trước, nên sau khi nhận nhà bạn có thể phát hiện những hư hỏng ẩn. Hãy luôn để dành 15% tổng ngân sách cho các phát sinh này.
3. **Tận dụng hỗ trợ từ Chính phủ (Hojokin):** Nhật Bản có nhiều gói hỗ trợ tài chính cho việc cải thiện cách nhiệt hoặc sửa nhà cho người già/khuyết tật.

Tra cứu giá bán khu vực để biết mức ngân sách sửa chữa tối đa mà bạn nên bỏ ra:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 4. Chiến lược cải tạo để tối ưu hóa lợi nhuận 📊

Đừng sửa nhà theo sở thích cá nhân nếu bạn định cho thuê. Hãy chọn những vật liệu bền, trung tính và dễ thay thế để tối ưu hóa chi phí vận hành sau này.

Xem nhu cầu thuê và mức giá thuê trung bình tại:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Sửa sang đúng cách là cách nhanh nhất để tăng vọt giá trị bất động sản của bạn!**

🚀 Khám phá ngay các cơ hội tại **[Keibai Finder Home](/)**.
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE',
      featuredImage: '/blogs/renovation-costs.png',
      content_ja,
      content_vi,
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      tags: ['リフォーム費用', 'リノベーション', '不動産投資', '予算計画', '住宅改修'],
      featuredImage: '/blogs/renovation-costs.png',
      title_ja: '競売物件落札後のリフォーム費用目安と予算の立て方',
      title_vi: 'Chi phí sửa chữa nhà cũ tại Nhật: Dự toán ngân sách cải tạo sau khi trúng thầu Keibai',
      title_en: 'Renovation Costs in Japan: Budgeting for Your Auction Property',
      title_zh: '日本老房翻新费用：竞标成功后的装修预算指南',
      content_ja,
      content_vi,
      content_en: content_vi,
      content_zh: content_vi,
    },
  });

  console.log('Renovation Guide added successfully.');
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
