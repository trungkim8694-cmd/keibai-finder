const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing Top 4 Websites Guide following the Standard...');
  
  const slug = encodeURIComponent('外国人におすすめの日本不動産競売サイトTOP4-信頼できる情報源');
  
  const content_ja = `
# 外国人投資家が選ぶ、日本の不動産競売・公売サイトTOP4 🚀

日本の不動産を市場価格より20〜40%安く購入できる「競売（Keibai）」。しかし、最大の壁は「情報」です。

膨大な日本語データの中から、外国人でも使いやすく信頼できる情報源を4つ厳選してご紹介します。 💡

### 1. 裁判所の競売物件情報サイト（BIT） - 信頼の一次ソース 🏛️

BIT（Broadcast Information System for Timber）は、日本の最高裁判所が運営する公式サイトです。

- **メリット**: 情報の正確性が100%。全ての「3点セット（物件明細書・現況調査報告書・評価書）」が無料で閲覧できます。
- **デメリット**: サイトが古く、日本語のみ。スマホ対応も不十分で、初心者には使いにくいのが難点です。

> 📊 **データで物件を比較:** 
> BITの生データをAIで解析し、投資価値を判定するには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. Keibai-Koubai.com - 外国人に最も優しいプラットフォーム 🌏

私たちのサイトは、BITの「難解さ」を解消するために設計されました。

- **メリット**: 多言語対応（英・越・中・日）に加え、AIによるリスク分析機能を搭載。占有者リスクや滞納管理費などを一目で把握できます。
- **サポート**: 入札から引き渡しまで、専門家による個別サポートも提供しています。

### 3. 981.jp - 民間最大級のポータルサイト 📊

不動産競売流通協会（FKR）が運営する、日本最大級の競売情報サイトです。

- **メリット**: 豊富な検索フィルターと、過去の落札価格データが充実しています。
- **デメリット**: 一部情報は有料。英語対応はしていますが、詳細な調査報告書は日本語のままです。

周辺エリアの適正価格を調べるには：
**👉 [不動産取引価格検索](/trade-find)**

### 4. Yahoo!オークション（公売） - 掘り出し物の宝庫 💰

税金滞納による差し押さえ物件が扱われる「公売（Koubai）」の主要プラットフォームです。

- **メリット**: 競売に比べて競争が少なく、小規模な物件や格安の空き家（Akiya）が見つかりやすいです。
- **注意**: 競売と異なり「引渡命令」制度がないため、上級者向けの側面があります。

エリアごとの需要と利回りをチェック：
**👉 [エリア分析マップ](/area-map)**

---

**正しい情報源を選べば、日本の不動産投資はもっと身近になります。**

🚀 **[Keibai Finder TOP](/)** で、あなたにぴったりの「お宝物件」を見つけましょう！
`;

  const content_vi = `
# Top 4 Website Đấu Giá Bất Động Sản Uy Tín Tại Nhật Bản Dành Cho Người Nước Ngoài 🚀

Mua nhà đấu giá (Keibai) là con đường ngắn nhất để sở hữu bất động sản tại Nhật với giá rẻ hơn thị trường từ 20-40%. Tuy nhiên, rào cản lớn nhất chính là thông tin. 💡

Dưới đây là danh sách 4 website hàng đầu giúp bạn săn bất động giá hời một cách an toàn và minh bạch.

### 1. Website của Tòa án Nhật Bản (BIT) - Nguồn dữ liệu gốc 🏛️

BIT (bit.kuis.go.jp) là trang web chính thức do Tòa án Nhật Bản quản lý. Đây là nơi mọi tài sản cưỡng chế được niêm yết đầu tiên.

- **Ưu điểm:** Độ chính xác 100%, chứa đầy đủ 3 bộ hồ sơ gốc (San-ten-setto).
- **Nhược điểm:** Giao diện lỗi thời, chỉ có tiếng Nhật và rất khó sử dụng cho người mới bắt đầu.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Chúng tôi giúp bạn "dịch" các báo cáo khô khan của BIT thành dữ liệu đầu tư trực quan tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Keibai-Koubai.com - Giải pháp tối ưu cho người nước ngoài 🌏

Nếu BIT là "thư viện thô" thì Keibai-Koubai.com là "người trợ lý thông minh" của bạn.

- **Hỗ trợ đa ngôn ngữ:** Hệ thống được tối ưu hóa giúp bạn hiểu rõ các thuật ngữ pháp lý phức tạp mà không cần Google Translate.
- **Phân tích rủi ro:** Cung cấp các báo cáo về tình trạng người cư trú và nợ tồn đọng.
- **Hỗ trợ 1:1:** Tư vấn từ khâu làm hồ sơ thầu đến khi nhận chìa khóa nhà.

### 3. Trang 981.jp - Hệ thống tra cứu quy mô lớn 📊

Được quản lý bởi Hiệp hội Hỗ trợ Đấu giá Bất động sản Nhật Bản (FKR), đây là cổng thông tin thương mại cực kỳ mạnh mẽ.

- **Ưu điểm:** Kho dữ liệu khổng lồ, lọc theo lợi nhuận đầu tư và khoảng cách đến ga.
- **Nhược điểm:** Nhiều tính năng nâng cao yêu cầu trả phí và bản dịch tiếng Anh chưa thực sự hoàn thiện.

So sánh lịch sử giá thầu khu vực để không đặt thầu quá cao:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 4. Đấu giá tài sản công (Koubai) - Yahoo Auctions 💰

Đây là nơi niêm yết tài sản do cơ quan thuế tịch thu.

- **Ưu điểm:** Ít cạnh tranh hơn đấu giá tòa án, phù hợp tìm kiếm nhà cũ (Akiya) giá siêu rẻ.
- **Nhược điểm:** Quy trình phức tạp và không có chế độ "Lệnh bàn giao" như đấu giá tòa án.

Xem tiềm năng phát triển của khu vực trước khi xuống tiền:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Lời khuyên từ chuyên gia:** Hãy dùng BIT để xem hồ sơ gốc, 981.jp để xem lịch sử giá và **Keibai-Koubai.com** để được hỗ trợ chuyên sâu nhất.

🚀 Khám phá ngay các cơ hội tại **[Keibai Finder Home](/)**.
`;

  const content_en = `
# Top 4 Trusted Real Estate Auction Websites in Japan for Foreigners 🚀

Buying property through court auctions (Keibai) is the fastest way to own real estate in Japan at 20-40% below market value. However, the biggest barrier is information. 💡

Here are the top 4 websites used by international investors to find great deals in the Land of the Rising Sun.

### 1. The Court Auction Information System (BIT) - The Original Source 🏛️

BIT (bit.kuis.go.jp) is the official website managed by the Japanese Supreme Court.

- **Pros:** 100% accuracy, direct access to the "3-Item Set" of legal documents.
- **Cons:** Outdated interface, Japanese only, and difficult for non-professionals to navigate.

> 📊 **SUPPORT TOOL:** 
> We transform BIT's raw data into intuitive investment insights at:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Keibai-Koubai.com - The Best Solution for Foreigners 🌏

If BIT is a "raw data library," Keibai-Koubai.com is your "intelligent assistant."

- **Multi-language Support:** Optimized systems help you understand complex legal terms without relying on Google Translate.
- **Risk Analysis:** Provides deep insights into occupant status and management fee arrears.
- **1-on-1 Support:** Expert guidance from bidding to property handover.

### 3. 981.jp - Large-Scale Search Portal 📊

Managed by the Real Estate Auction Distribution Association (FKR), this is one of the largest commercial portals.

- **Pros:** Huge database with advanced filters like ROI and distance to stations.
- **Cons:** Some features require paid subscriptions, and deep reports are mostly in Japanese.

Lookup actual transaction prices to set a competitive bid:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. Public Auctions (Koubai) - Yahoo Auctions 💰

A platform for properties seized due to unpaid taxes.

- **Pros:** Less competition than court auctions; great for finding cheap countryside houses (Akiya).
- **Cons:** No "Eviction Order" system, making it more suitable for advanced investors.

Check area demand and growth potential:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **READY TO INVEST?**
Discover your next opportunity at **[Keibai Finder Home](/)**.
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE',
      featuredImage: '/blogs/top-websites.png',
      content_ja,
      content_vi,
      content_en,
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      tags: ['競売サイト', '不動産投資サイト', 'BIT', '981.jp', '公売'],
      featuredImage: '/blogs/top-websites.png',
      title_ja: '外国人投資家が選ぶ、日本の不動産競売・公売サイトTOP4',
      title_vi: 'Top 4 Website Đấu Giá Bất Động Sản Uy Tít Tại Nhật Bản Dành Cho Người Nước Ngoài',
      title_en: 'Top 4 Trusted Real Estate Auction Websites in Japan for Foreigners',
      title_zh: '外国人首选：日本四大权威房地产拍卖网站推荐',
      content_ja,
      content_vi,
      content_en,
      content_zh: content_vi,
    },
  });

  console.log('Top Websites Guide added successfully.');
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
