const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Writing Eviction (Mewatashi) Guide following the Standard...');
  
  const slug = encodeURIComponent('落札後の引渡命令と強制執行-明渡しの完全ガイド');
  
  const content_ja = `
# 落札後の「引渡命令」と「強制執行」：占有者が退去しない時の完全対策ガイド 🚀

不動産競売で最も不安なことの一つは、「落札したのに前の住人が出ていってくれない」ことではないでしょうか。

しかし、安心してください。日本の法律には、買受人（落札者）を守るための強力な制度が用意されています。 💡

### 1. 第一歩：話し合いによる「任意退去」 🤝

まずは、占有者と誠実に話し合うことから始めます。

- **交渉のコツ**: 退去費用（引っ越し代程度）を提示することで、早期に円満な解決を図れるケースが多いです。
- **メリット**: 法的手続きのコストと時間を節約できます。

> 📊 **コスト試算の重要性:** 
> 退去交渉にかけるべき予算を算出するには：
> **👉 [市場分析ダッシュボード](/insights)**

### 2. 強力な法的武器「引渡命令（ひきわたしめいれい）」 ⚖️

話し合いがまとまらない場合、裁判所に「引渡命令」を申し立てます。

- **期間**: 代金納付から6ヶ月以内に申し立てる必要があります。
- **効果**: 裁判所が占有者に対し、物件を明け渡すよう命じる決定です。

### 3. 最終手段「強制執行（きょうせいしっこう）」 🛠️

引渡命令が出ても退去しない場合、執行官による強制的な執行を行います。

1. **催告**: 執行官が現地を訪れ、期限内に退去するよう警告します。
2. **断行**: 期限を過ぎても退去しない場合、専門業者が荷物を運び出し、鍵を交換します。

周辺エリアの取引価格を確認し、執行費用を含めた収支を検討：
**👉 [不動産取引価格検索](/trade-find)**

### 4. 費用と期間の目安 💰

- **費用**: 荷物の量によりますが、30万〜100万円程度が一般的です。
- **期間**: 申し立てから完了まで、概ね1〜3ヶ月程度かかります。

### 5. Keibai Finderで占有者リスクを予測 📊

私たちは過去のデータから、占有者がいる物件の難易度を分析し、投資判断をサポートしています。

エリアごとの需要とトラブル発生率の傾向をチェック：
**👉 [エリア分析マップ](/area-map)**

---

**正当な権利行使を知ることで、競売への不安は解消されます。**

🚀 **[Keibai Finder TOP](/)** でAIが選別した優良物件をチェック！
`;

  const content_vi = `
# Quy trình Cưỡng chế thi hành án (Mewatashi): Phải làm gì nếu chủ cũ không chịu chuyển đi? 🚀

Nỗi sợ lớn nhất của nhà đầu tư Keibai là: "Đã trả hết tiền nhưng chủ cũ vẫn lỳ lợm không chịu giao nhà". 💡

Đừng lo lắng, luật pháp Nhật Bản có một quy trình cực kỳ chặt chẽ và mạnh mẽ để bảo vệ quyền lợi của bạn.

### 1. Bước 1: Thương lượng hòa giải (Hanamizuki) 🤝

Trước khi dùng đến pháp luật, hãy thử cách tiếp cận "nhẹ nhàng" nhất.

- **Mẹo:** Đôi khi hỗ trợ họ một khoản chi phí chuyển nhà nhỏ (khoảng 10-20 vạn Yên) sẽ giúp bạn nhận nhà nhanh hơn nhiều so với việc kiện tụng.
- **Lợi ích:** Tiết kiệm thời gian và giữ được mối quan hệ tốt với hàng xóm xung quanh.

> 📊 **CÔNG CỤ HỖ TRỢ:** 
> Tính toán biên độ lợi nhuận để dự trù phí hỗ trợ chuyển nhà tại:
> **👉 [Bảng Phân Tích Thị Trường](/insights)**

### 2. Bước 2: Xin Lệnh bàn giao (Hikihodashi Meirei) ⚖️

Nếu thương lượng thất bại, bạn hãy gửi đơn lên Tòa án để xin Lệnh bàn giao.

- **Thời hạn:** Bạn phải nộp đơn trong vòng 6 tháng kể từ ngày thanh toán hết tiền nhà.
- **Kết quả:** Tòa án ra phán quyết buộc người đang cư trú phải rời đi. Đây là giấy thông hành pháp lý quan trọng nhất của bạn.

### 3. Bước 3: Cưỡng chế thi hành (Kyosei Shikko) 🛠️

Đây là "vũ khí hạng nặng" cuối cùng. Một đội ngũ cưỡng chế của tòa án sẽ đến tận nơi:

1. **Thông báo:** Đội thi hành án sẽ đến dán thông báo và cho người ở một thời hạn cuối cùng.
2. **Thực thi:** Nếu hết hạn vẫn không đi, đội ngũ chuyên nghiệp sẽ dọn toàn bộ đồ đạc ra kho và thay ổ khóa mới cho bạn.

Tra cứu giá khu vực để đảm bảo tổng chi phí (gồm cả phí cưỡng chế) vẫn thấp hơn thị trường:
**👉 [Tra Cứu Giá Thực Tế](/trade-find)**

### 4. Chi phí và Thời gian dự kiến 💰

- **Chi phí:** Thường dao động từ **300.000 đến 1.000.000 Yên** tùy vào lượng đồ đạc trong nhà.
- **Thời gian:** Toàn bộ quy trình từ lúc nộp đơn đến lúc nhận nhà mất khoảng **1 đến 3 tháng**.

### 5. Keibai Finder giúp bạn dự báo rủi ro 📊

AI của chúng tôi phân tích tình trạng người ở trong hồ sơ tòa án để cảnh báo mức độ khó khăn của việc đòi nhà.

Kiểm tra tiềm năng và đặc điểm dân cư khu vực tại:
**👉 [Bản Đồ Phân Tích Khu Vực](/area-map)**

---

**Nắm vững luật pháp là chìa khóa để đầu tư Keibai an toàn!**

🚀 Khám phá ngay các cơ hội đầu tư tại **[Keibai Finder Home](/)**.
`;

  const content_en = `
# Eviction Process in Japan (Mewatashi): What to Do if the Occupant Won't Move? 🚀

The biggest fear for Keibai investors is: "I've paid in full, but the previous owner won't leave." 💡

Don't worry. Japanese law provides a very strict and powerful process to protect your rights as the new owner.

### 1. Step 1: Negotiation (The Gentle Approach) 🤝

Before jumping to legal action, try a sincere conversation.

- **Tip:** Offering a small "relocation fee" (usually 100,000 to 200,000 JPY) can often get you the keys much faster than going to court.
- **Benefit:** Saves time and maintains peace with the neighbors.

> 📊 **SUPPORT TOOL:** 
> Calculate your profit margin to budget for relocation fees here:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Step 2: Eviction Order (Hikihodashi Meirei) ⚖️

If negotiation fails, apply to the court for an Eviction Order.

- **Deadline:** You must apply within 6 months of making the final payment.
- **Result:** The court issues a formal order for the occupant to vacate. This is your primary legal weapon.

### 3. Step 3: Compulsory Execution (Kyosei Shikko) 🛠️

This is the final "heavy weapon." A court execution team will intervene:

1. **Notice:** The bailiff visits the site, post a notice, and sets a final deadline.
2. **Execution:** If the occupant remains past the deadline, a professional team will move all belongings to storage and change the locks for you.

Check area prices to ensure your total cost (including eviction) is still below market value:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. Estimated Costs and Timeline 💰

- **Cost:** Generally ranges from **300,000 to 1,000,000 JPY**, depending on the volume of belongings.
- **Timeline:** The entire process usually takes **1 to 3 months**.

### 5. Keibai Finder: Predicting Occupancy Risks 📊

Our AI analyzes occupant status in court files to warn you about the difficulty of taking possession.

Check area demand and neighborhood characteristics at:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **MASTER THE LAW TO INVEST SAFELY!**
Discover secure investment opportunities at **[Keibai Finder Home](/)**.
`;

  const article = await prisma.dailyDigest.upsert({
    where: { slug },
    update: {
      category: 'GUIDE',
      featuredImage: '/blogs/eviction-guide.png',
      content_ja,
      content_vi,
      content_en,
    },
    create: {
      slug,
      category: 'GUIDE',
      publishDate: new Date(),
      tags: ['引渡命令', '強制執行', '明渡し', '不動産競売', '占有者対策'],
      featuredImage: '/blogs/eviction-guide.png',
      title_ja: '落札後の「引渡命令」と「強制執行」：占有者が退去しない時の完全対策ガイド',
      title_vi: 'Quy trình Cưỡng chế thi hành án (Mewatashi): Phải làm gì nếu chủ cũ không chịu chuyển đi?',
      title_en: 'Eviction Process in Japan (Mewatashi): What to Do if the Occupant Won\'t Move?',
      title_zh: '落札后的强制执行与交付命令：原业主不愿搬走该怎么办？',
      content_ja,
      content_vi,
      content_en,
      content_zh: content_vi,
    },
  });

  console.log('Eviction Guide added successfully.');
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
