const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing Keibai Red Flags Guide following the Standard...');
  
  const slug = encodeURIComponent('プロが教える「買ってはいけない」競売物件のレッドフラッグ 🚩');
  
  const content_ja = `
# プロが教える「絶対に手を出してはいけない」競売物件のレッドフラッグ（警告サイン） 🚩

競売市場には市場価格の半額以下という驚くべき物件もありますが、その中にはプロでも避ける「地雷物件」が混ざっています。

今回は、裁判所の資料（3点セット）で見つけたら即座に検討を止めるべき5つの警告サインを解説します。 💡

### 1. 法定地上権（Houtei Chijoken）の不成立 🏗️

土地と建物の所有者が異なり、落札しても土地を利用する権利が認められないケースです。

- **リスク**: 落札後に土地所有者から「建物の収去（取り壊し）」を求められる法的リスクがあります。
- **回避策**: 物件明細書の「法定地上権」の項目を必ずチェックしましょう。

> 📊 **データで安全性を確認:** 
> 法的なリスクがスクリーニングされた優良物件を探すには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. 占有者が「特殊」または「複数」いる物件 🏠

単なる前所有者ではなく、権利関係が複雑な占有者がいる場合です。

- **リスク**: 暴力団関係者や、非常に多くの賃借人が入り乱れている場合、明け渡し交渉が長期化し、多額の費用がかかります。
- **回避策**: 現況調査報告書の占有者欄に不自然な点がないか精査しましょう。

### 3. 再建築不可（Saichiku Fuka）の物件 🚧

現在の法律の基準を満たしておらず、一度壊すと二度と新しい家を建てられない物件です。

- **リスク**: 資産価値が極めて低く、銀行融資も受けられません。出口戦略（売却）が困難になります。

周辺エリアの資産価値を確認し、再建築不可のリスクを評価：
**👉 [不動産取引価格検索](/trade-find)**

### 4. 異常に高額な滞納管理費（マンション） 💰

滞納額が数百万円に達し、落札価格と合わせると市場価格を超えてしまうケースです。

- **リスク**: 投資利回りがマイナスになる可能性があります。
- **回避策**: 滞納額の総額（遅延損害金を含む）を必ず事前に計算してください。

### 5. 心理的瑕疵（事故物件）の深刻なケース ⚠️

建物内で深刻な事件や事故があった物件です。

- **リスク**: 賃貸に出す際や売却する際に大きな告知義務が発生し、収益性が大幅に低下します。

エリアごとの需要予測と心理的瑕疵の影響を確認：
**👉 [エリア分析マップ](/area-map)**

---

**「安さ」には必ず理由があります。レッドフラッグを見逃さないことが成功への近道です。**

🚀 **[Keibai Finder TOP](/)** では、AIがこれらのリスクを自動的に検知してサポートします！
`;

  const content_vi = `
# Kinh nghiệm thực tế: Những căn nhà Keibai "không nên chạm vào" - Dấu hiệu đỏ trong hồ sơ 🚩

Trong thế giới đấu giá bất động sản Nhật Bản, đôi khi mức giá rẻ lại là cái bẫy chết người. Có những căn nhà mà ngay cả các nhà đầu tư sành sỏi nhất cũng phải "lắc đầu" bỏ qua. 💡

Dưới đây là 5 dấu hiệu đỏ (Red Flags) mà bạn cần nhận diện ngay lập tức khi đọc hồ sơ tòa án.

### 1. Không hình thành quyền sử dụng đất (Houtei Chijoken) 🏗️

Đây là trường hợp nhà và đất có chủ sở hữu khác nhau, và sau khi đấu giá, căn nhà không được pháp luật công nhận quyền tồn tại trên mảnh đất đó.

- **Rủi ro:** Chủ đất có quyền yêu cầu bạn **phá dỡ nhà** ngay sau khi bạn vừa bỏ tiền ra mua.
- **Cách nhận biết:** Kiểm tra mục "法定地上権" (Houtei Chijoken) trong Bản mô tả tài sản. Nếu ghi là "不成立" (Không hình thành), hãy tránh xa!

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Tìm kiếm những căn nhà đã được lọc sạch rủi ro pháp lý tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Người cư trú có "lai lịch phức tạp" hoặc quá đông 🏠

Không chỉ là chủ cũ, mà có sự xuất hiện của các tổ chức hoặc nhiều người thuê nhà không rõ ràng.

- **Rủi ro:** Việc thương lượng đòi nhà sẽ kéo dài nhiều năm và tốn kém hàng triệu Yên phí pháp lý.
- **Cách nhận biết:** Đọc kỹ Báo cáo hiện trạng xem có ai đang chiếm giữ nhà với các hợp đồng thuê nhà "mập mờ" hay không.

### 3. Nhà không thể xây lại (Saichiku-fuka) 🚧

Căn nhà nằm trong khu vực không đáp ứng các tiêu chuẩn xây dựng hiện hành (ví dụ: đường vào quá hẹp).

- **Rủi ro:** Một khi căn nhà cũ hỏng, bạn không thể xin phép xây mới. Giá trị tài sản này gần như bằng 0 khi muốn bán lại.

Tra cứu giá trị thực tế của các khu vực lân cận để so sánh:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 4. Nợ phí quản lý "khủng" (Đối với Mansion) 💰

Số tiền nợ phí quản lý và quỹ tu bổ vượt quá khả năng sinh lời của căn hộ.

- **Rủi ro:** Bạn trúng thầu giá rẻ nhưng phải gánh thêm khoản nợ vài triệu Yên, dẫn đến tổng chi phí cao hơn cả giá thị trường.
- **Cách nhận biết:** Tòa án luôn ghi rõ số nợ này trong hồ sơ, hãy cộng nó vào giá thầu của bạn trước khi quyết định.

### 5. Lỗi tâm lý (Jiko-bukken) nghiêm trọng ⚠️

Những căn nhà xảy ra các vụ án hoặc sự cố nghiêm trọng ảnh hưởng đến tâm lý người ở.

- **Rủi ro:** Rất khó để cho thuê hoặc bán lại sau này, dù giá mua ban đầu có rẻ thế nào đi nữa.

Xem bản đồ tiềm năng và nhu cầu khu vực tại:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Đừng để sự hấp dẫn của giá rẻ làm lu mờ lý trí. Hãy là nhà đầu tư thông thái!**

🚀 Truy cập **[Keibai Finder Home](/)** để nhận các cảnh báo rủi ro tự động từ AI.
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'CAUTION',
      featuredImage: '/blogs/red-flags.png',
      content_ja,
      content_vi,
    },
    create: {
      slug,
      category: 'CAUTION',
      publishDate: new Date(),
      tags: ['買ってはいけない物件', 'レッドフラッグ', '法定地上権', '再建築不可', '不動産投資リスク'],
      featuredImage: '/blogs/red-flags.png',
      title_ja: 'プロが教える「絶対に手を出してはいけない」競売物件のレッドフラッグ',
      title_vi: 'Kinh nghiệm thực tế: Những căn nhà Keibai "không nên chạm vào" - Dấu hiệu đỏ trong hồ sơ',
      title_en: 'Professional Advice: Keibai Properties You Should Never Touch',
      title_zh: '专家教你识别日本拍卖房中的“地雷”：绝对不能碰的红旗信号',
      content_ja,
      content_vi,
      content_en: content_vi,
      content_zh: content_vi,
    },
  });

  console.log('Red Flags Guide added successfully.');
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
