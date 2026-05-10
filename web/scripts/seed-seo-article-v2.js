const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding Japanese-Optimized SEO Article to /blogs...');
  
  // New Japanese Slug
  const slug = encodeURIComponent('不動産競売で30パーセント安く購入する方法');
  const oldSlug = 'cach-mua-nha-dau-gia-nhat-ban-re-hon-30-phan-tram';
  
  // Delete old one if exists
  await prisma.dailyDigest.deleteMany({
    where: { slug: oldSlug }
  });

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE'
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      // Japanese Tags
      tags: ['不動産競売', '競売ノウハウ', '不動産投資', '節約術', '日本不動産'],
      featuredImage: null,
      
      // JAPANESE CONTENT (Primary Priority)
      title_ja: '日本の不動産競売で市場価格より30%安く購入する方法とは？',
      content_ja: `
# 日本の不動産競売（けいばい）で市場価格より30%安く購入するための戦略ガイド

不動産競売は、一般の不動産市場よりも大幅に安く物件を手に入れることができるチャンスです。しかし、単に入札するだけでは「30%安く」という目標は達成できません。プロの投資家が実践している5つのステップを解説します。

## 1. 基準価額と市場価格の差を理解する
競売物件の「売却基準価額」は、鑑定士によって算出されますが、内覧ができないことや明渡しのリスクを考慮し、通常は市場価格の**6割〜7割程度**に設定されます。

## 2. 「3点セット」を読み解く力
競売において唯一の公式情報である「3点セット」を徹底的に読み込むことが成功への近道です。
- **物件明細書**: 権利関係や競売後の負担。
- **現況調査報告書**: 占有者の有無や建物の状態。
- **評価書**: 周辺環境や価格算出の根拠。

## 3. Keibai Finderで「投資ギャップ」を分析する
当サイトでは、国土交通省の取引実例データ（MLIT）と競売価格を比較した**「投資ギャップ（Investment Gap）」**を表示しています。乖離率が25%以上の物件をターゲットにすることで、確実に安く購入できる可能性が高まります。

## 4. 隠れたコストを算出する
落札価格以外にかかる費用を正確に見積もることが重要です。
- **滞納管理費**: マンションの場合、前所有者の滞納分を引き継ぐ必要があります。
- **残置物撤去費用**: 前所有者の荷物が残っている場合の処分費用。
- **リフォーム費用**: 事前の写真から劣化具合を推測します。

## 5. 冷静な入札価格の設定
競売の熱狂に流されず、「落札価格 + 諸経費 < 市場価格の80%」というルールを徹底しましょう。

---
**今すぐ30%オフのチャンスを探しませんか？**
[Keibai Finder](https://keibai-koubai.com) の「投資ギャップ」フィルタを活用して、お宝物件を見つけましょう。
`,

      // ENGLISH CONTENT
      title_en: 'How to Buy Auction Houses in Japan at 30% Below Market Price?',
      content_en: `
# How to Buy Real Estate in Japanese Auctions at 30% Below Market Price?

Real estate auctions (Keibai) in Japan offer a significant opportunity to acquire properties at a lower price than the open market. However, achieving a "30% discount" requires a strategic approach. Here are the 5 key steps to success.

## 1. Understanding the Base Price
The "Sale Base Price" in court auctions is usually set at **60-70% of the market value** to account for risks like the inability to view the interior and potential eviction issues.

## 2. Mastering the "Three-Item Set" (San-ten-setto)
The only official information available is the "Three-Item Set" documents.
- **Property Description:** Physical condition of the property.
- **Record of Rights:** Ownership and legal encumbrances.
- **Evaluation Report:** Surrounding environment and valuation basis.

## 3. Analyzing the "Investment Gap" on Keibai Finder
Our platform provides an **Investment Gap** metric that compares the auction price with real transaction data from the MLIT. Target properties with a gap of over 25% for the best deals.

## 4. Calculating Hidden Costs
- **Management Fee Arrears:** For condos, the winner must pay the previous owner's unpaid fees.
- **Eviction/Removal Costs:** Handling any items or occupants left behind.
- **Renovation Costs:** Estimating damages from available photos.

## 5. Discipline in Bidding
Follow the golden rule: **Winning Bid + Costs < 80% of Market Value.**

---
**Find your 30% discount deal today on [Keibai Finder](https://keibai-koubai.com)!**
`,

      // VIETNAMESE CONTENT
      title_vi: 'Làm thế nào để mua nhà đấu giá tại Nhật rẻ hơn 30%?',
      content_vi: `
# Làm thế nào để mua nhà đấu giá (Keibai) tại Nhật rẻ hơn 30% so với thị trường?

Đầu tư bất động sản đấu giá (Keibai) tại Nhật Bản đang trở thành một xu hướng hấp dẫn nhờ khả năng sở hữu nhà với mức giá thấp hơn đáng kể so với thị trường tự do.

## 1. Hiểu rõ về "Giá khởi điểm"
Giá khởi điểm thường thấp hơn thị trường từ **30% đến 40%** do tính chất rủi ro của đấu giá.

## 2. Phân tích "Bộ 3 tài liệu"
- **Báo cáo mô tả:** Tình trạng ngôi nhà.
- **Báo cáo quyền lợi:** Tính pháp lý.
- **Báo cáo hiện trạng:** Ai đang ở trong nhà.

## 3. Sử dụng Keibai Finder để tính "Investment Gap"
Chỉ số **Investment Gap** giúp bạn biết mức độ chênh lệch giữa giá đấu giá và giá thị trường thực tế. Hãy chọn những căn có chênh lệch trên 25%.

## 4. Kiểm tra chi phí ẩn
- Nợ phí quản lý (Mansion).
- Chi phí dọn dẹp đồ đạc cũ.
- Chi phí sửa chữa.

## 5. Chiến lược đặt giá
Luôn tuân thủ: **Giá trúng thầu + Chi phí < 80% Giá thị trường.**

---
**Tìm kiếm cơ hội ngay tại [Keibai Finder](https://keibai-koubai.com)!**
`,

      // CHINESE CONTENT
      title_zh: '如何以低于市场价 30% 的价格购买日本拍卖房？',
      content_zh: `
# 如何以低于市场价 30% 的价格购买日本拍卖房？

日本房地产拍卖（Keibai）提供了一个以远低于市场价格购买房产的绝佳机会。

## 1. 了解基准价格
拍卖基准价通常设定在市场价の **60-70%** 左右。

## 2. 解读“三件套”文件
- **物业描述**: 房屋物理状况。
- **权利记录**: 法律纠纷和所有权。
- **评估报告**: 环境和估值依据。

## 3. 使用 Keibai Finder 分析“投资差距”
通过比较拍卖价与国土交通省（MLIT）的实际成交价，找出差距超过 25% 的优质房产。

## 4. 计算隐藏成本
- **拖欠的管理费**: 公寓买家需承担前业主的欠费。
- **清理和搬迁费用**。
- **装修费用**。

## 5. 理性竞价策略
遵循原则：**中标价 + 额外成本 < 市场价的 80%**。

---
**立即在 [Keibai Finder](https://keibai-koubai.com) 寻找您的投资机会！**
`,
    },
  });

  console.log('Article updated with Japanese slug and content. Slug:', slug);
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
