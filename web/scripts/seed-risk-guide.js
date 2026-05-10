const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing 5 Risks of Keibai following the Standard...');
  
  const slug = encodeURIComponent('不動産競売の5大リスクと回避策-占有者・建物ダメージ');
  
  const content_ja = `
# 不動産競売の5大リスクと失敗しないための回避策 ⚠️

競売物件は「宝の山」かもしれませんが、十分な準備なしに足を踏み入れると大きな損失を被る可能性があります。

特に注意すべき5つのリスクと、その対策を徹底解説します。 💡

### 1. 占有者問題：居座る住人への対応 🏠

競売物件には、前の所有者や不法に占拠している人が住んでいる場合があります。

- **リスク**: 任意で退去してくれない場合、法的な立ち退き手続きが必要です。
- **回避策**: 「現況調査報告書」で占有者の氏名や属性を必ず確認してください。

> 📊 **データでリスクを最小化:** 
> 占有者リスクを考慮した上での投資判断をするには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. 建物ダメージ：見えない瑕疵（不具合） 🛠️

競売物件は事前に中を見ることができません。

- **リスク**: 雨漏り、シロアリ被害、あるいは「ゴミ屋敷」状態である可能性があります。
- **回避策**: 報告書の室内写真の細部（壁のシミや床の歪みなど）を凝視しましょう。

### 3. 滞納金の承継義務 💰

マンションの場合、前所有者の管理費や修繕積立金の滞納を落札者が引き継ぐ必要があります。

- **リスク**: 数百万円の滞納があるケースも珍しくありません。
- **回避策**: 入札前に必ず管理組合に確認するか、報告書の記載を精査しましょう。

周辺エリアの資産価値を調べるには：
**👉 [不動産取引価格検索](/trade-find)**

### 4. 境界確定や土地の権利関係 🔍

土地と建物で所有者が異なったり、隣地との境界が不明確な場合があります。

- **リスク**: 落札後に隣人とトラブルになったり、建物の建て替えができない可能性があります。
- **回避策**: 「物件明細書」の注意書きを隅々まで読み込みましょう。

### 5. 融資の難易度 🏦

一般の住宅ローンは競売物件には適用しにくい傾向があります。

- **リスク**: 落札しても資金調達ができず、保証金を没収される可能性があります。
- **回避策**: 競売ローンを取り扱っている銀行に事前相談しておくことが必須です。

エリアごとの需要とリスクのバランスを確認：
**👉 [エリア分析マップ](/area-map)**

---

**リスクを正しく理解すれば、競売は最高の投資機会になります。**

🚀 **[Keibai Finder TOP](/)** でAIがリスクをスクリーニングした優良物件を探しましょう！
`;

  const content_vi = `
# 5 rủi ro "xương máu" khi mua nhà đấu giá và cách phòng tránh hiệu quả ⚠️

Mua nhà đấu giá Keibai tại Nhật có thể mang lại lợi nhuận khổng lồ, nhưng cũng tiềm ẩn những rủi ro có thể khiến bạn trắng tay nếu không am hiểu. 💡

### 1. Vấn đề người cư trú bất hợp pháp 🏠

Đây là rủi ro phổ biến nhất khi chủ cũ hoặc những người không có quyền lợi liên quan cố tình ở lại.

- **Rủi ro:** Họ từ chối dọn đi, gây khó khăn cho việc sử dụng tài sản.
- **Cách phòng tránh:** Đọc kỹ phần "Người chiếm hữu" trong Báo cáo hiện trạng. Nếu là người không có căn cứ pháp lý, hãy chuẩn bị chi phí cho việc xin Lệnh bàn giao.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Đánh giá biên độ lợi nhuận sau khi trừ chi phí giải quyết người cư trú tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Hư hỏng nặng và "Nhà rác" (Gomi-yashiki) 🛠️

Vì không được vào xem nhà, bạn có thể đối mặt với tình trạng bên trong tồi tệ hơn tưởng tượng.

- **Rủi ro:** Nhà bị thấm dột, mối mọt hoặc chứa đầy rác thải tích tụ nhiều năm.
- **Cách phòng tránh:** Quan sát kỹ các góc chụp ảnh trong hồ sơ tòa án. Nếu thấy dấu hiệu tường ố vàng hoặc sàn nhà cong vênh, hãy dự trù ít nhất 2-3 triệu Yên cho việc sửa chữa.

### 3. Nợ phí quản lý và các khoản phí tồn đọng 💰

Đối với căn hộ chung cư, bạn là người chịu trách nhiệm cuối cùng cho các khoản nợ của chủ cũ.

- **Rủi ro:** Số tiền nợ phí quản lý có thể lên tới hàng triệu Yên.
- **Cách phòng tránh:** Luôn cộng thêm số nợ này vào giá thầu dự kiến của bạn để đảm bảo không bị hớ.

Tra cứu lịch sử giao dịch khu vực để không đặt thầu quá cao:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 4. Rủi ro về ranh giới và quyền sử dụng đất 🔍

Nhiều trường hợp đất và nhà có chủ sở hữu khác nhau hoặc ranh giới với nhà hàng xóm không rõ ràng.

- **Rủi ro:** Tranh chấp với hàng xóm hoặc không thể xây lại nhà trong tương lai.
- **Cách phòng tránh:** Kiểm tra kỹ bản đồ đo đạc và các ghi chú đặc biệt trong Bản mô tả chi tiết tài sản.

### 5. Khó khăn trong việc vay vốn ngân hàng 🏦

Hầu hết các gói vay mua nhà thông thường không áp dụng cho nhà đấu giá do tính rủi ro cao.

- **Rủi ro:** Bạn trúng thầu nhưng không thể thanh toán đúng hạn, dẫn đến việc mất khoản tiền đặt cọc 20%.
- **Cách phòng tránh:** Hãy liên hệ với các ngân hàng có gói vay chuyên biệt cho nhà đấu giá (Keibai Loan) trước khi nộp phiếu thầu.

Xem bản đồ tiềm năng phát triển của khu vực để có cái nhìn dài hạn:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Hiểu rõ rủi ro là bước đầu tiên để trở thành nhà đầu tư chuyên nghiệp!**

🚀 Truy cập ngay **[Keibai Finder Home](/)** để tìm kiếm những cơ hội đầu tư an toàn nhất.
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'CAUTION',
      featuredImage: '/blogs/risks-warning.png',
      content_ja,
      content_vi,
    },
    create: {
      slug,
      category: 'CAUTION',
      publishDate: new Date(),
      tags: ['競売のリスク', '占有者問題', '建物ダメージ', '不動産投資失敗', '注意喚起'],
      featuredImage: '/blogs/risks-warning.png',
      title_ja: '不動産競売の5大リスクと失敗しないための回避策',
      title_vi: '5 rủi ro "xương máu" khi mua nhà đấu giá và cách phòng tránh hiệu quả',
      title_en: 'Top 5 Risks in Japanese Court Auctions and How to Avoid Them',
      title_zh: '购买日本拍卖房的5大风险及避坑指南',
      content_ja,
      content_vi,
      content_en: content_vi,
      content_zh: content_vi,
    },
  });

  console.log('Risk Guide added successfully.');
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
