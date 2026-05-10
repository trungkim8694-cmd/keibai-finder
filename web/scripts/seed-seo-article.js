const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding SEO Article to /blogs...');
  
  const slug = 'cach-mua-nha-dau-gia-nhat-ban-re-hon-30-phan-tram';
  
  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE'
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      tags: ['keibai', 'kinh-nghiem', 'dau-tu', 'bat-dong-san-nhat'],
      featuredImage: null,
      
      // VIETNAMESE CONTENT (Primary for SEO focus as requested)
      title_vi: 'Làm thế nào để mua nhà đấu giá tại Nhật rẻ hơn 30%?',
      content_vi: `
# Làm thế nào để mua nhà đấu giá (Keibai) tại Nhật rẻ hơn 30% so với thị trường?

Đầu tư bất động sản đấu giá (Keibai) tại Nhật Bản đang trở thành một xu hướng hấp dẫn nhờ khả năng sở hữu nhà với mức giá thấp hơn đáng kể so với thị trường tự do. Tuy nhiên, để đạt được con số **"rẻ hơn 30%"**, bạn cần nắm vững các bước chiến lược dưới đây.

## 1. Hiểu rõ về "Giá khởi điểm" (Starting Price)
Trong các cuộc đấu giá tòa án Nhật Bản, giá khởi điểm thường được xác định bởi thẩm định viên dựa trên giá trị tài sản trừ đi các rủi ro đặc thù của đấu giá. Thông thường, mức giá này thấp hơn thị trường từ **30% đến 40%**. 

**Bí quyết:** Đừng chỉ nhìn vào giá khởi điểm, hãy so sánh nó với giá giao dịch thực tế (Market Price) trong khu vực để biết mức biên lợi nhuận (Margin) thực sự là bao nhiêu.

## 2. Phân tích kỹ lưỡng "Bộ 3 tài liệu" (3点セット)
Đây là bước quan trọng nhất để tránh rủi ro "tiền mất tật mang". Bộ 3 tài liệu bao gồm:
- **Báo cáo mô tả tài sản:** Mô tả chi tiết tình trạng vật lý của ngôi nhà.
- **Báo cáo quyền lợi:** Ai đang sở hữu, có tranh chấp hay nợ nần gì liên quan không?
- **Báo cáo hiện trạng:** Ai đang sống trong đó và họ có quyền cư trú hợp pháp không?

## 3. Sử dụng công cụ Keibai Finder để tính toán "Investment Gap"
Tại Keibai Finder, chúng tôi cung cấp chỉ số **MLIT Investment Gap**. Đây là con số so sánh giá khởi điểm với dữ liệu giao dịch thực tế từ Bộ Đất đai, Hạ tầng, Giao thông và Du lịch Nhật Bản.
- Nếu biên độ chênh lệch trên 20%, đó là một cơ hội đầu tư tốt.
- Nếu trên 30%, bạn đang có cơ hội sở hữu một "món hời" thực sự.

## 4. Kiểm tra các rủi ro tiềm ẩn (Hidden Risks)
Để mua được nhà rẻ mà vẫn an toàn, bạn phải kiểm tra:
- **Tình trạng nợ quản lý:** Đối với chung cư (Mansion), người mua trúng thầu phải thanh toán các khoản phí quản lý chưa trả của chủ cũ.
- **Quyền sử dụng đất:** Đảm bảo bạn mua cả đất và nhà (Ownership) chứ không phải chỉ là quyền thuê đất (Leasehold).

## 5. Chiến lược đặt giá thầu (Bidding Strategy)
Đừng đặt giá quá cao chỉ vì quá thích ngôi nhà đó. Hãy giữ cái đầu lạnh và tuân thủ nguyên tắc: **Giá trúng thầu + Chi phí sửa chữa < 80% Giá thị trường.**

---
**Bạn muốn tìm những căn nhà có mức giá rẻ hơn 30% ngay hôm nay?**
Sử dụng ngay bộ lọc "Investment Gap > 25%" trên [Keibai Finder](https://keibai-koubai.com) để không bỏ lỡ cơ hội tốt nhất!
`,

      // JAPANESE CONTENT (Optimized for JP UI)
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

      // ENGLISH CONTENT (Bonus for SEO)
      title_en: 'How to Buy Auction Houses in Japan at 30% Below Market Price?',
      content_en: `# How to Buy Auction Houses in Japan at 30% Below Market Price?...`,
      
      title_zh: '如何以低于市场价 30% 的价格购买日本拍卖房？',
      content_zh: `# 如何以低于市场价 30% 的价格购买日本拍卖房？...`,
    },
  });

  console.log('Article created with ID:', article.id);
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
