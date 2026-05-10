const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Translating remaining blog articles to high-quality English...');

  // 1. Eviction Guide
  const slug1 = encodeURIComponent('落札後の引渡命令と強制執行-明渡しの完全ガイド');
  const en1 = `
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

  // 2. Renovation Costs
  const slug2 = encodeURIComponent('競売物件落札後のリフォーム費用目安と予算の立て方 🏠');
  const en2 = `
# Renovation Costs in Japan: Budgeting for Your Auction Property 🏠

Buying property cheaply through an auction is only the first step. To turn that house into an ideal home or a profitable rental asset, you need a smart renovation plan. 💡

### 1. Reference Quotes for Popular Items 🛠️

Repair costs in Japan are relatively high due to labor costs. Here are some reference figures:

- **New Flooring and Wallpaper (Whole House):** 500,000 - 1,000,000 JPY.
- **Water Area Renovation (Kitchen, Bath, Toilet):** 1,500,000 - 3,000,000 JPY.
- **Exterior Painting and Roofing (Detached House):** 1,000,000 - 1,500,000 JPY.
- **Underground Plumbing and Electrical:** 500,000 - 1,000,000 JPY.

> 📊 **SUPPORT TOOL:** 
> Calculate your target ROI after renovation here:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. Estimated Total Budget by Property Type 💰

- **Condominium (Mansion):** Approximately 3,000,000 - 6,000,000 JPY for basic repairs. A full renovation can cost 8,000,000 JPY or more.
- **Detached House (Kominka):** Approximately 5,000,000 - 10,000,000 JPY. Houses over 30 years old often need additional seismic reinforcement.

### 3. Tips to Save Money and Avoid Unexpected Costs ⚠️

1. **Prioritize the "Core" First:** Fix the roof, plumbing, and electrical before worrying about paint colors or furniture.
2. **Always Have a Contingency Fund:** Since you cannot view the house beforehand, you may discover hidden damage after taking possession. Always set aside 15% of your total budget for these surprises.
3. **Take Advantage of Government Subsidies (Hojokin):** Japan offers various financial support programs for insulation improvements or barrier-free renovations.

Check local selling prices to determine the maximum renovation budget you should spend:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. Renovation Strategy to Maximize Profit 📊

Don't renovate based on personal preference if you plan to rent it out. Choose durable, neutral, and easily replaceable materials to optimize operating costs later.

Check rental demand and average rent in the area:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **SMART RENOVATION IS THE FASTEST WAY TO SKYROCKET YOUR PROPERTY VALUE!**
Discover opportunities at **[Keibai Finder Home](/)**.
`;

  // 3. Red Flags
  const slug3 = encodeURIComponent('プロが教える「買ってはいけない」競売物件のレッドフラッグ 🚩');
  const en3 = `
# Professional Advice: Keibai Properties You Should Never Touch - Red Flags in Court Records 🚩

In the world of Japanese real estate auctions, sometimes a low price is a deadly trap. There are properties that even the most seasoned investors will walk away from. 💡

Here are 5 Red Flags you must identify immediately when reading court documents.

### 1. No Statutory Surface Rights (Houtei Chijoken) 🏗️

This is a case where the house and the land have different owners, and after the auction, the house is not legally recognized as having the right to exist on that land.

- **Risk:** The land owner has the right to demand that you **demolish the house** immediately after you have paid for it.
- **Prevention:** Check the "法定地上権" (Houtei Chijoken) section in the Property Description. If it says "不成立" (Not established), stay away!

> 📊 **SUPPORT TOOL:** 
> Find properties that have been screened for legal risks here:
> **👉 [Market Analysis Dashboard](/insights)**

### 2. "Complex" or Excessive Occupancy 🏠

Not just the previous owner, but the presence of organizations or multiple unclear tenants.

- **Risk:** Negotiating for possession will take years and cost millions of yen in legal fees.
- **Prevention:** Carefully read the Status Report to see if anyone is occupying the house with "ambiguous" lease contracts.

### 3. Non-Rebuildable Properties (Saichiku-fuka) 🚧

The house is in an area that does not meet current building standards (e.g., the access road is too narrow).

- **Risk:** Once the old house is damaged, you cannot get permission to build a new one. The value of this asset is nearly zero when you want to resell.

Lookup actual transaction values of nearby areas for comparison:
**👉 [Actual Transaction Price Lookup](/trade-find)**

### 4. "Extreme" Management Fee Arrears (For Mansions) 💰

The amount of unpaid management and repair fees exceeds the profitability of the apartment.

- **Risk:** You win the bid at a low price but have to shoulder an additional debt of several million yen, leading to a total cost higher than the market price.
- **Prevention:** The court always states this debt in the files; add it to your bid price before deciding.

### 5. Serious Psychological Defects (Jiko-bukken) ⚠️

Houses where serious incidents or accidents have occurred that affect the occupants' psychology.

- **Risk:** It is very difficult to rent or resell later, no matter how cheap the initial purchase price was.

Check area potential and demand at:
**👉 [Area Analysis Map](/area-map)**

---
🚀 **DON'T LET THE ALLURE OF CHEAP PRICES BLIND YOUR JUDGMENT. BE A SMART INVESTOR!**
Visit **[Keibai Finder Home](/)** for automated risk warnings from our AI.
`;

  const articles = [
    { slug: slug1, en: en1 },
    { slug: slug2, en: en2 },
    { slug: slug3, en: en3 }
  ];

  for (const art of articles) {
    await prisma.dailyDigest.update({
      where: { slug: art.slug },
      data: { content_en: art.en }
    });
  }

  console.log('Remaining articles translated to high-quality English.');
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
