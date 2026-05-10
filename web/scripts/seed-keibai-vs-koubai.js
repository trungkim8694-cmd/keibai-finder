const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing Keibai vs Koubai Comparison following the Standard...');
  
  const slug = encodeURIComponent('競売-Keibai-と公売-Koubai-の違い徹底解説');
  
  const content_ja = `
# 競売（Keibai）と公売（Koubai）の違いとは？賢い投資家が知っておくべき比較ガイド 🚀

日本の不動産を安く購入する方法として「競売」と「公売」があります。

似ているようで実は全く異なるこれら2つの仕組みについて、初心者でもわかるように解説します。 💡

### 1. 根本的な違い：なぜ売りに出されるのか？ 🏛️

- **競売（Keibai）**: 住宅ローンの返済が滞った場合に、銀行などの債権者が裁判所に申し立てて売却される仕組み。
- **公売（Koubai）**: 税金（所得税、固定資産税など）を滞納した場合に、税務署や自治体が差し押さえて売却する仕組み。

> 📊 **データで比較:** 
> 現在公開されている競売物件の投資効率を確認するには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. プラットフォームと入札方法 📝

- **競売**: 全国の裁判所で実施されます。入札は郵送または裁判所へ直接行います。
- **公売**: 国税庁の「公売オークション（Yahoo!オークションなど）」を通じて、オンラインで入札できるケースが多いのが特徴です。

### 3. 物件調査のしやすさ 🔍

- **競売**: 裁判所が作成する「3点セット」があり、占有者の状況などが詳しくわかります。
- **公売**: 物件に関する資料（公売広報など）が競売ほど詳細でない場合が多く、より自己責任での調査が求められます。

エリアごとの取引実態を調べるにはこちら：
**👉 [不動産取引価格検索](/trade-find)**

### 4. 引渡命令（強制執行）の有無 ⚖️

ここが最大の注意点です！

- **競売**: 占有者が退去しない場合、裁判所に「引渡命令」を申し立てて強制執行が可能です。
- **公売**: 原則として引渡命令の制度がなく、占有者との交渉はすべて自力で行う必要があります。

⚠️ **リスク管理:** 公売の方が手続きは手軽ですが、落札後のトラブル解決は難易度が高い傾向にあります。

### 5. どちらを選ぶべきか？ 📊

- **初心者の方**: 資料が充実しており、法的救済措置（引渡命令）がある**競売**がおすすめです。
- **上級者の方**: ライバルが少ない掘り出し物を狙うなら**公売**も選択肢に入ります。

エリアごとの詳細な需要分析はこちら：
**👉 [エリア分析マップ](/area-map)**

---

**あなたはどちらの仕組みで「お宝物件」を探しますか？**

🚀 **[Keibai Finder TOP](/)** では、主に裁判所競売物件の高度な解析データを提供しています。
`;

  const content_vi = `
# Sự khác biệt giữa Keibai (Đấu giá tòa án) và Koubai (Đấu giá công sản/thuế) 🚀

Nếu bạn đang tìm mua bất động sản giá rẻ tại Nhật, bạn sẽ thường gặp hai thuật ngữ: **Keibai** và **Koubai**. 💡

Dù cả hai đều là hình thức đấu giá, nhưng quy trình và mức độ rủi ro lại rất khác nhau. Bài viết này sẽ giúp bạn phân biệt rõ ràng.

### 1. Nguồn gốc: Tại sao tài sản bị mang ra đấu giá? 🏛️

- **Keibai (競売 - Cạnh mại):** Do nợ ngân hàng hoặc nợ cá nhân. Ngân hàng yêu cầu **Tòa án** bán nhà để thu hồi nợ.
- **Koubai (公売 - Công mại):** Do nợ thuế (thuế thu nhập, thuế thị dân, thuế nhà đất...). **Cục thuế** hoặc chính quyền địa phương tịch thu tài sản để bán.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> So sánh mức giá giữa các loại hình đấu giá tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Nơi tổ chức đấu giá 📝

- **Keibai:** Tổ chức trực tiếp tại các Tòa án địa phương trên toàn nước Nhật.
- **Koubai:** Thường được tổ chức trực tuyến (online) thông qua các trang web như Yahoo! Auction hoặc cổng thông tin của Cục Thuế.

### 3. Hồ sơ điều tra 🔍

- **Keibai:** Có "Bộ 3 tài liệu" cực kỳ chi tiết, có hình ảnh bên trong và tình trạng người ở do thẩm định viên tòa án lập.
- **Koubai:** Hồ sơ thường sơ sài hơn, nhà đầu tư phải tự mình điều tra thực tế nhiều hơn.

Kiểm tra lịch sử giá giao dịch thực tế của khu vực:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 4. Quy trình nhận nhà (Quan trọng nhất!) ⚖️

Đây là điểm khác biệt lớn nhất mà bạn cần lưu ý:

- **Keibai:** Nếu người cũ không chịu dọn đi, bạn có quyền xin **"Lệnh bàn giao"** từ tòa án để cưỡng chế họ ra ngoài.
- **Koubai:** Thường **không có chế độ cưỡng chế**. Bạn phải tự mình thương lượng với người đang ở. Nếu họ ngoan cố, việc đòi nhà sẽ rất vất vả.

### 5. Nên chọn loại hình nào? 📊

- **Người mới bắt đầu:** Nên chọn **Keibai** vì pháp lý rõ ràng và có sự hỗ trợ cưỡng chế từ tòa án.
- **Nhà đầu tư chuyên nghiệp:** Có thể chọn **Koubai** để tìm những "viên ngọc thô" ít người cạnh tranh.

Xem bản đồ tiềm năng khu vực để đưa ra quyết định:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Bạn đã sẵn sàng để bắt đầu chưa?**

🚀 Hãy truy cập **[Keibai Finder Home](/)** để xem các phân tích chuyên sâu về thị trường đấu giá Nhật Bản!
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE',
      featuredImage: '/blogs/keibai-vs-koubai.png',
      content_ja,
      content_vi,
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      tags: ['競売と公売の違い', 'Keibai', 'Koubai', '不動産投資', '日本不動産'],
      featuredImage: '/blogs/keibai-vs-koubai.png',
      title_ja: '競売（Keibai）と公売（Koubai）の違いとは？賢い投資家が知っておくべき比較ガイド',
      title_vi: 'Sự khác biệt giữa Keibai (Đấu giá tòa án) và Koubai (Đấu giá công sản/thuế)',
      title_en: 'Difference between Keibai and Koubai in Japan',
      title_zh: '日本拍卖房：法院拍卖 (Keibai) 与 公卖 (Koubai) 的区别',
      content_ja,
      content_vi,
      content_en: content_vi,
      content_zh: content_vi,
    },
  });

  console.log('Keibai vs Koubai Guide added successfully.');
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
