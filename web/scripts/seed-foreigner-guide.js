const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing Foreigner Keibai Guide following the Standard...');
  
  const slug = encodeURIComponent('外国人でも日本の不動産競売に参加できる？条件と注意点を徹底解説');
  
  const content_ja = `
# 外国人でも日本の不動産競売に参加できる？購入条件と法的ルールを完全解説 🚀

日本の不動産市場は外国人に対して非常に開放的ですが、裁判所が行う「競売（Keibai）」には特有のルールがあります。

外国人投資家や居住者が競売に参加するための条件を詳しく解説します。 💡

### 1. 外国人でも競売物件を購入できるのか？ 🏛️

結論から言うと、**外国人でも制限なく競売物件を購入できます**。

日本の法律では、外国人の不動産所有に対して特別な制限はありません。居住地（海外在住）やビザの種類に関わらず、最高価買受人（落札者）になることが可能です。

> 📊 **投資効率をチェック:** 
> 外国人の方に人気のエリアや利回りの高い物件を探すには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. ビザ（在留資格）は必要か？ 🛂

所有権を取得するだけであれば、**ビザは一切不要**です。観光ビザや、日本に一度も来たことがない方でも落札可能です。

ただし、以下の点に注意してください：
- **居住する場合**: 実際に住むには適切な在留資格が必要です。
- **融資（ローン）**: ビザがない場合、日本の銀行から融資を受けるのは極めて困難です。原則として現金での一括払いが必要になります。

### 3. 最も重要なハードル：日本国内の銀行口座 💰

競売に参加する上で、最も高い壁となるのが「銀行口座」です。

- **保証金の納付**: 入札時に物件の基準価額の20%を裁判所の口座に振り込む必要があります。
- **残金の支払い**: 海外送金では時間がかかりすぎるため、日本国内の口座から振り込むのが一般的です。

💡 **対策:** 日本に口座がない場合は、不動産会社や司法書士などの「代理人」を通じて参加することが推奨されます。

### 4. 必要な書類と手続き 📝

- **住民票**: 日本在住の方は住民票。海外在住の方は、自国の公証役場などで発行された「宣誓供述書（Affidavit）」が必要です。
- **印鑑証明**: または署名証明書。

周辺エリアの適正な取引価格を確認するには：
**👉 [不動産取引価格検索](/trade-find)**

### 5. Keibai Finderでグローバルな投資を 📊

私たちは、多言語でのサポートとAIによる物件選別で、外国人投資家の皆様をサポートしています。

エリアごとの詳細なデータ分析はこちら：
**👉 [エリア分析マップ](/area-map)**

---

**日本の不動産競売で、あなたの投資ポートフォリオを拡大しませんか？**

🚀 **[Keibai Finder TOP](/)** で最新のチャンスを見つけましょう！
`;

  const content_vi = `
# Người nước ngoài có thể mua nhà đấu giá (Keibai) tại Nhật không? Điều kiện và quy định mới nhất 🚀

Mua bất động sản qua đấu giá tòa án là một cách tuyệt vời để sở hữu tài sản giá rẻ tại Nhật. Tuy nhiên, đối với người nước ngoài, có một số quy định về **Visa**, **Tài khoản ngân hàng** và **Giấy tờ pháp lý** cần đặc biệt lưu ý. 💡

### 1. Người nước ngoài có được phép tham gia đấu giá không? 🏛️

Câu trả lời là **CÓ**. Luật pháp Nhật Bản không hạn chế quyền sở hữu bất động sản đối với người nước ngoài.

Bất kể bạn đang sống tại Nhật hay đang ở nước ngoài, bạn đều có quyền tham gia đấu giá Keibai và đứng tên sở hữu 100% tài sản đó.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Kiểm tra ngay các khu vực có tiềm năng tăng giá cao nhất cho nhà đầu tư:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Yêu cầu về Visa (Thẻ ngoại kiều) 🛂

Về mặt sở hữu, bạn **KHÔNG cần Visa đặc biệt**. Thậm chí bạn có thể mua nhà khi đang ở Việt Nam hoặc sang Nhật bằng Visa du lịch.

Tuy nhiên, có 2 vấn đề lớn:
- **Cư trú:** Nếu muốn thực sự chuyển đến ở, bạn vẫn phải có Visa lao động, kinh doanh hoặc vợ/chồng người Nhật.
- **Vay ngân hàng:** Nếu không có Vĩnh trú (Eijyu) hoặc Visa dài hạn, việc vay vốn ngân hàng để mua nhà đấu giá là cực kỳ khó khăn. Bạn thường phải chuẩn bị 100% tiền mặt.

### 3. Vấn đề tài khoản ngân hàng - "Nút thắt" quan trọng 💰

Đây là khó khăn lớn nhất nếu bạn không cư trú tại Nhật:

- **Nộp tiền bảo lãnh:** Bạn phải chuyển khoảng 20% giá khởi điểm vào tài khoản của tòa án để được tham gia đấu giá.
- **Thanh toán nốt:** Việc chuyển tiền từ nước ngoài về Nhật có thể mất nhiều thời gian và thủ tục rườm rà, dễ làm trễ hạn thanh toán của tòa án.

💡 **Lời khuyên:** Bạn nên có một người đại diện pháp lý hoặc công ty dịch vụ tại Nhật để hỗ trợ thực hiện các giao dịch chuyển tiền này.

### 4. Giấy tờ cần chuẩn bị 📝

- **Người ở Nhật:** Thẻ ngoại kiều, Juminhyo (Giấy cư trú), con dấu (Inkan).
- **Người ở nước ngoài:** Cần bản tuyên thệ (Affidavit) được công chứng tại cơ quan ngoại giao hoặc văn phòng công chứng tại nước sở tại.

Tra cứu lịch sử giá thực tế để đưa ra mức giá thầu hợp lý:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 5. Keibai Finder đồng hành cùng nhà đầu tư quốc tế 📊

Chúng tôi cung cấp dữ liệu phân tích đa ngôn ngữ, giúp bạn xóa bỏ rào cản ngôn ngữ và pháp lý khi đầu tư vào Nhật Bản.

Xem phân tích nhu cầu khu vực tại:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Sở hữu nhà tại Nhật không còn là giấc mơ xa vời!**

🚀 Khám phá ngay các cơ hội đầu tư tại **[Keibai Finder Home](/)**.
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE',
      featuredImage: '/blogs/foreigners-guide.png',
      content_ja,
      content_vi,
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      tags: ['外国人の不動産購入', 'Keibai', '日本不動产', '外国人ビザ', '銀行口座'],
      featuredImage: '/blogs/foreigners-guide.png',
      title_ja: '外国人でも日本の不動産競売に参加できる？購入条件と法的ルールを完全解説',
      title_vi: 'Người nước ngoài có thể mua nhà đấu giá (Keibai) tại Nhật không? Điều kiện và quy định mới nhất',
      title_en: 'Can Foreigners Buy Court Auction Properties in Japan?',
      title_zh: '外国人可以购买日本法院拍卖房吗？条件与规定详解',
      content_ja,
      content_vi,
      content_en: content_vi,
      content_zh: content_vi,
    },
  });

  console.log('Foreigner Guide added successfully.');
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
