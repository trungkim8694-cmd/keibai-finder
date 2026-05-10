const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Completing English and Chinese Content for Caution Article...');
  
  const slug = encodeURIComponent('競売不動産の占有者問題と法的リスク');
  
  const content_en = `
# Caution & Risk: Occupant Issues and Legal Status in Japanese Auctions ⚠️

Buying real estate at auction in Japan can save you millions of yen, but the "low price" often comes with unique **legal risks** and **occupant issues** that you must handle yourself. 💡

Here is a comprehensive guide on the pitfalls to watch out for:

---

### 1. The Occupant Problem: Who is Living There? 🏠

Unlike a regular sale, court auctions do not guarantee a "vacant" property. You may find:

- **The Previous Owner:** Still living in the house with no place to go.
- **Third-Party Tenants:** Some rental agreements are protected by law, and you cannot evict them immediately.
- **Illegal Occupants:** Though rare, some people might occupy the house without any legal right.

💡 **Pro Tip:** Read the "Report on Current Status" (Genkyo Chosa Hokokusho) in the [Three-Item Set] carefully to understand who is currently staying in the property.

---

### 2. Eviction Orders and Compulsory Execution ⚖️

If the occupant refuses to leave voluntarily, you must take legal action:

- **Eviction Order (Hikihodashi Meirei):** You apply to the court for a decision ordering the occupant to vacate.
- **Compulsory Execution:** If they still refuse, a court bailiff will physically remove them and their belongings.

⚠️ **Hidden Costs:** Compulsory execution can cost between **300,000 to 1,000,000 JPY**. Always include this in your investment budget!

---

### 3. Management Fee Arrears (Condominiums) 💰

When winning a "Mansion" (Condo) at auction, you inherit the previous owner's debts.

- According to the Condominium Management Act, the winner is responsible for **all unpaid management and repair fees**.
- Sometimes these arrears can reach millions of yen.

📊 Use our [Market Analysis Dashboard](/insights) to check the "Investment Gap" and ensure your bid accounts for these debts.

---

### 4. Legal Liens and Protected Rights 🔍

Some rights are NOT extinguished after the auction:

- **Counter-rights of Tenants:** Certain leases must be honored by the new owner.
- **Statutory Surface Rights:** If the land and building owners are different, the building's right to use the land might be protected.

---

### Summary: Due Diligence is Your Best Shield 🛡️

Most auction risks can be avoided by thorough research:
1. Study the **Three-Item Set** documents from cover to cover.
2. Use the [Area Analysis Map](/area-map) to understand the neighborhood context.
3. Consult a professional if you are unsure about the legal status.

**Control the risks to unlock the true value of Japanese real estate auctions.**

---
🚀 **Ready to check the legal status of an interesting property?**
Visit [Keibai Finder](/) and deep-dive into our property data now.
`;

  const content_zh = `
# 警告与风险：日本拍卖房的占有者问题与法律风险详解 ⚠️

虽然通过竞拍可以以低于市场价的价格购买房产，但也会面临**占有者问题**和**法律风险**。 💡

---

### 1. 占有者问题：谁住在里面？ 🏠

竞拍房不保证是“空房”。可能会遇到：
- **原业主**: 仍然住在里面，没有搬迁计划。
- **租客**: 某些租赁协议受法律保护，不能立即要求搬离。

💡 **建议:** 在出价前，务必仔细阅读法院提供的“现状调查报告书”。

---

### 2. 交付命令与强制执行 ⚖️

如果占有者拒绝搬走，需要采取法律手段：
- **交付命令**: 向法院申请要求占有者搬离。
- **强制执行**: 如果不遵守命令，法院执行官将强制其搬离。

⚠️ **隐藏成本:** 强制执行可能耗资 **30万至100万日元**。

---

### 3. 拖欠的管理费（公寓） 💰

竞拍公寓时，买家需要承担前业主拖欠的所有管理费和修缮积立金。

📊 请参考我们的 [市场分析仪表板](/insights) 来计算实际的投资回报率。

---

### 总结：调查是最好的武器 🛡️

1. 仔细研读 [三件套] 文件。
2. 使用 [区域分析地图](/area-map) 了解周边环境。

---
🚀 **立即在 [Keibai Finder](/) 寻找安全的投资机会。**
`;

  const article = await prisma.dailyDigest.update({
    where: { slug },
    data: {
      content_en,
      content_zh,
    },
  });

  console.log('English and Chinese content completed for the caution article.');
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
