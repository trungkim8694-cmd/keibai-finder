const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Translating all blog articles to English and Chinese with Amazing Standard...');

  // 1. Keibai A-Z Guide
  const slug1 = encodeURIComponent('不動産競売の基礎知識-AからZまで');
  const en1 = `
# What is Keibai? A-Z Guide to Japanese Court Real Estate Auctions 🚀

Have you ever heard of buying a house in Japan at 60-70% of its market value? That is the unique appeal of **Keibai (Court Auctions)**. 💡

This guide will take you from basic concepts to the actual process of owning a Keibai property.

### 1. What is Keibai? 🏛️

Keibai (競売) is a legal process where the court forcibly sells the assets of a person who cannot repay their debts (usually bank mortgages) to compensate the creditors.

In this transaction, the "Seller" is the Court itself, not a private owner or a real estate agent.

> 📊 **SUPPORT TOOL:** 
> See the list of properties with the highest "Investment Gap" here:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Why is Keibai so cheap? 💰

There are 3 main reasons why Keibai prices are lower than the open market:

- **No Inner Viewings:** You only see photos in the court report; you cannot enter the property before bidding.
- **As-Is Condition:** The court is not responsible for repairs or warranties.
- **Self-Eviction:** If there are occupants, you must negotiate or use legal means to have them leave.

Because of these risks, the starting price is very low, creating a large profit margin for investors.

### 3. The Basic Auction Process 📝

1. **Search & Investigation:** Study the court documents (The 3-Item Set).
2. **Deposit & Bidding:** Pay a guarantee deposit (usually 20% of the starting price) and submit your bid.
3. **Opening of Bids:** The highest bidder becomes the winner.
4. **Payment & Ownership Transfer:** Pay the remaining balance and receive the title deed.

Check actual transaction prices in the area to set your bid accurately:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. The "3-Item Set" (San-ten-setto) - The Investor's Bible 🔍

These are the only official documents you can rely on:

- **Property Description:** Legal rights and encumbrances.
- **Status Report:** Interior photos and occupant information.
- **Evaluation Report:** The basis for the court's starting price.

### 5. How Keibai Finder Helps You 📊

We use AI to analyze thousands of listings daily, helping you find "clean" properties with the highest growth potential.

Check the rental demand and area prices on our map:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **START YOUR JOURNEY NOW:**
Visit **[Keibai Finder Home](/)** to find the best opportunities today.
`;

  // 2. Keibai vs Koubai
  const slug2 = encodeURIComponent('競売-Keibai-と公売-Koubai-の違い徹底解説');
  const en2 = `
# Keibai vs. Koubai: Understanding the Difference in Japanese Auctions 🚀

If you are looking for cheap real estate in Japan, you will often encounter two terms: **Keibai** and **Koubai**. 💡

While both are auctions, the processes and risk levels are quite different. This guide will help you distinguish between them.

### 1. The Origin: Why is the property being sold? 🏛️

- **Keibai (競売):** Due to bank or private debt. The bank asks the **Court** to sell the house to recover the loan.
- **Koubai (公売):** Due to unpaid taxes (Income tax, City tax, etc.). The **Tax Office** or local government seizes and sells the asset.

> 📊 **SUPPORT TOOL:** 
> Compare price levels across different auction types here:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Where the Auction is Held 📝

- **Keibai:** Held directly at local Courts throughout Japan.
- **Koubai:** Often held online via platforms like Yahoo! Auction or the National Tax Agency portal.

### 3. Investigation Documents 🔍

- **Keibai:** Provides a very detailed "3-Item Set" with interior photos and occupant status.
- **Koubai:** Documents are often much simpler; investors must conduct more independent research.

Check actual area transaction history:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. Property Handover (Most Important!) ⚖️

This is the biggest difference you must be aware of:

- **Keibai:** If the previous occupant refuses to leave, you can apply for an **"Eviction Order"** from the court to forcibly remove them.
- **Koubai:** Generally **no eviction system**. You must negotiate with the occupant yourself. If they are stubborn, it can be very difficult.

### 5. Which one should you choose? 📊

- **Beginners:** Should choose **Keibai** due to clearer legal protections and the eviction order system.
- **Professional Investors:** May choose **Koubai** to find "hidden gems" with less competition.

Check the area demand map to make your decision:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **READY TO START?**
Visit **[Keibai Finder Home](/)** for deep insights into the Japanese auction market!
`;

  // 3. Foreigners Guide (already done but ensuring Amazing quality)
  const slug3 = encodeURIComponent('外国人でも日本の不動産競売に参加できる？条件と注意点を徹底解説');
  const en3 = `
# Can Foreigners Buy Court Auction Properties (Keibai) in Japan? 🚀

Buying real estate through court auctions is an excellent way to own property at a low price in Japan. However, for foreigners, there are specific rules regarding **Visas**, **Bank Accounts**, and **Legal Documents** to keep in mind. 💡

### 1. Are foreigners allowed to participate? 🏛️

The answer is **YES**. Japanese law does not restrict real estate ownership for foreigners.

Whether you live in Japan or abroad, you have the right to participate in Keibai and own 100% of the property title.

> 📊 **SUPPORT TOOL:** 
> Check which areas have the highest potential for international investors:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Visa Requirements 🛂

For ownership purposes, you **DO NOT need a specific visa**. You can even buy a house while on a tourist visa or living entirely outside Japan.

However, consider two points:
- **Residency:** To actually live in the house, you still need a valid working, business, or spouse visa.
- **Mortgages:** Without Permanent Residency (Eijyu) or a long-term visa, getting a bank loan for a Keibai property is extremely difficult. You usually need 100% cash.

### 3. The Bank Account "Bottle-neck" 💰

This is the biggest hurdle if you do not reside in Japan:

- **Guarantee Deposit:** You must transfer about 20% of the starting price to the court's account to participate.
- **Final Payment:** Transferring large sums from abroad can be slow and complicated, potentially causing you to miss the court's strict payment deadline.

💡 **Pro Tip:** We recommend having a legal representative or a service company in Japan to handle these financial transactions for you.

### 4. Required Documents 📝

- **Residents in Japan:** Zairyu Card, Juminhyo (Certificate of Residence), and Inkan (Seal).
- **Residents Abroad:** An **Affidavit** notarized at your local embassy or a notary public in your home country.

Check actual transaction prices to set a reasonable bid:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 5. Keibai Finder: Supporting Global Investors 📊

We provide multi-language analysis to help you clear language and legal barriers when investing in Japan.

Check area demand analysis at:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **YOUR JAPANESE HOME IS WITHIN REACH!**
Discover investment opportunities at **[Keibai Finder Home](/)**.
`;

  // 4. 5 Risks
  const slug4 = encodeURIComponent('不動産競売の5大リスクと回避策-占有者・建物ダメージ');
  const en4 = `
# Top 5 Critical Risks in Japanese Court Auctions and How to Avoid Them ⚠️

Buying Keibai properties in Japan can lead to massive profits, but it also carries risks that could lead to significant losses if you are not well-informed. 💡

### 1. Illegal Occupants 🏠

This is the most common risk where the previous owner or unauthorized persons refuse to leave.

- **Risk:** They refuse to vacate, making it difficult to use or rent the property.
- **Prevention:** Read the "Status Report" carefully. If there is no legal basis for occupancy, prepare for the cost of an Eviction Order.

> 📊 **SUPPORT TOOL:** 
> Evaluate your profit margin after accounting for eviction costs here:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Heavy Damage and "Garbage Houses" (Gomi-yashiki) 🛠️

Since you cannot enter the house before buying, the interior condition might be worse than expected.

- **Risk:** Leaking roofs, termite damage, or accumulated trash.
- **Prevention:** Closely examine every photo in the court files. If you see stains on the walls or warped floors, budget at least 2-3 million JPY for renovations.

### 3. Inherited Management Fee Arrears 💰

For condominiums (Mansions), you are legally responsible for the previous owner's debts.

- **Risk:** Arrears for management and repair fees can reach millions of yen.
- **Prevention:** Always add these debts to your expected bid price to ensure you don't overpay.

Lookup local transaction history to avoid bidding too high:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. Boundary and Land Right Risks 🔍

In some cases, the land and the house have different owners, or boundaries with neighbors are unclear.

- **Risk:** Legal disputes with neighbors or inability to rebuild the house in the future.
- **Prevention:** Carefully check the survey map and special notes in the Property Description.

### 5. Financing Difficulties 🏦

Most standard home loans do not apply to auctions due to the inherent risks.

- **Risk:** You win the bid but cannot secure financing, leading to the loss of your 20% deposit.
- **Prevention:** Contact banks that offer specialized "Keibai Loans" before you submit your bid.

Check the area's long-term growth potential:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **KNOWLEDGE IS YOUR BEST DEFENSE!**
Visit **[Keibai Finder Home](/)** to find the safest investment opportunities.
`;

  const articles = [
    { slug: slug1, en: en1 },
    { slug: slug2, en: en2 },
    { slug: slug3, en: en3 },
    { slug: slug4, en: en4 }
  ];

  for (const art of articles) {
    await prisma.dailyDigest.update({
      where: { slug: art.slug },
      data: { content_en: art.en }
    });
  }

  console.log('All articles translated to English with Amazing Standard.');
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
