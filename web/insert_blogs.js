const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Load environment variables
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const connectionString = process.env.DATABASE_URL;
console.log('Using connection URL:', connectionString ? '(defined)' : '(undefined)');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const articles = [
  {
    slug: 'keibai-support-fees-guide',
    category: 'GUIDE',
    tags: ['競売サポート', 'コンサルティング料', '仲介手数料', '不動産ビジネス'],
    featuredImage: null,
    title_ja: '競売サポート手数料の相場と決め方：仲介手数料上限を超えて収益化する合法的なビジネスモデル',
    title_vi: 'Chiến lược tính phí dịch vụ hỗ trợ đấu giá (Keibai): Mô hình kinh doanh hợp pháp tối ưu doanh thu cho Agency',
    title_en: 'How to Structure Keibai Support Fees: Legal Revenue Models That Exceed Brokerage Fee Limits',
    title_zh: '竞标支持费用指南：房地产中介的合法商业模式',
    content_ja: `# 競売サポート手数料の相場と決め方：仲介手数料上限を超えて収益化する合法的なビジネスモデル

多くの不動産会社が「競売不動産サポート事業」に関心を持ちながらも、参入を躊躇する最大の理由が「手数料の法的な上限」に関する誤解です。

宅地建物取引業法（宅建法）により、一般的な不動産仲介手数料は「3% + 6万円（税別）」が上限と定められています。しかし、競売サポート業務は一般的な「売買の媒介（仲介）」とは業務性質が大きく異なるため、適切な契約形態を選択することで、仲介手数料の上限を超えたコンサルティング報酬を得ることが法的に可能です。

本記事では、競売サポート報酬の相場、合法的な契約設計、そしてサポート会社としての適正な収益化モデルについて徹底解説します。

---

## 1. 競売サポート手数料の市場相場

現在、日本国内の競売サポート会社が請求している手数料は、主に以下の2つのパターンに分かれます。

### ① 定額報酬型（コンサルティング基本料）
入札前の物件調査、三点セットの分析、権利関係の整理、資金計画の立案などをカバーする基本料金です。
*   **相場**: 10万円 〜 30万円（税別）
*   **特徴**: 落札の成否にかかわらず、調査実務の対価として発生する設計にすることが多く、サポート会社の初期調査コストを回収するために重要です。

### ② 成果報酬型（落札成功報酬）
顧客が目的の物件を無事に落札できた場合にのみ発生する報酬です。
*   **相場**: 落札価格（または市場流通価格）の 3% 〜 5%
*   **特徴**: 顧客側にとっては「落札できなければ無駄な費用が発生しない」ため、非常に提案しやすいモデルです。

---

## 2. 仲介手数料の上限規制（3% + 6万円）をクリアする合法的アプローチ

宅建業法における仲介手数料の制限は、あくまで「売買の媒介（仲介）」という取引行為に対する対価です。

競売物件の入札においては、サポート会社は取引の「仲介（媒介）」を行っていません（※裁判所が売却を行うため）。したがって、以下の業務に対する「コンサルティング業務委託契約」を締結することで、仲介手数料とは別枠での報酬受領が可能となります。

### 合法化のための3つの鉄則
1.  **「コンサルティング業務委託契約書」を締結する**
    契約締結時、契約書名や条項に「媒介」「仲介」という文言を使用せず、「競売入札に伴う物件調査・権利調整および引渡支援業務委託契約」と明確に定義します。
2.  **実質的なコンサルティング実務を提供する**
    単に書類を代行するだけではなく、以下の具体的な専門実務を必ず提供し、その実績をレポートとして残します。
    *   占有者との立ち退き交渉のシミュレーションとアドバイス
    *   リフォーム・リノベーション費用の見積もり作成
    *   管轄裁判所での事件記録の閲覧と謄本取得・分析
3.  **成功報酬だけでなく、調査実費・コンサル報酬の内訳を明記する**
    契約書内で、報酬が「何に対する対価なのか」を明確にします（例：物件調査報告書作成費：〇〇円、占有者交渉支援費：〇〇円など）。

---

## 3. サポート会社が用意すべき契約書・書類テンプレート

トラブルを未然に防ぎ、顧客との間で強固な信頼関係を築くために、以下の3つのステップで書面を交わすことを推奨します。

1.  **事前説明書（コンサルティングの範囲）**
    競売のリスクと、サポート会社が提供するサービスの限界（落札を確約するものではないこと等）を明記します。
2.  **業務委託契約書（報酬の規定）**
    報酬額、支払時期（落札後〇日以内等）、落札できなかった場合の取扱について定めます。
3.  **業務完了報告書**
    物件が引き渡され、占有者の立ち退きが完了した時点で、書面をもって業務完了を確認します。

---

## まとめ：Keibai Finderを活用した集客と提案の最大化

競売サポート事業で継続的に案件を獲得するためには、いかに「入札を検討している見込み客」と早期に出会えるかが勝負です。

[keibai-koubai.com](https://www.keibai-koubai.com) では、月間数万人の購入検討者が物件情報を検索しています。サポート会社として無料のパートナー登録を行うことで、対応エリアの物件ページに貴社の相談窓口を自動で露出させることができ、広告費をかけずに直接問い合わせを獲得することが可能になります。

正しい法的知識を身につけ、プロフェッショナルなサポートを提供することで、既存 of 仲介事業に代わる強固な第2の収益 of 柱を構築しましょう。`,
    content_vi: `# Chiến lược tính phí dịch vụ hỗ trợ đấu giá (Keibai): Mô hình kinh doanh hợp pháp tối ưu doanh thu cho Agency

Một trong những rào cản lớn nhất khiến nhiều công ty bất động sản tại Nhật Bản do dự khi bước chân vào lĩnh vực hỗ trợ đấu giá bất động sản (競売サポート) là những hiểu lầm xung quanh quy định pháp lý về phí môi giới.

Theo Luật Kinh doanh Giao dịch Bất động sản Nhật Bản (宅建業法), phí môi giới mua bán thông thường (仲介手数料) bị giới hạn nghiêm ngặt ở mức trần "3% + 6 vạn Yên" (chưa thuế). Tuy nhiên, do bản chất của hoạt động hỗ trợ đấu giá khác hoàn toàn với giao dịch môi giới truyền thống, các doanh nghiệp hoàn toàn có thể thu mức phí dịch vụ/tư vấn cao hơn hạn mức này một cách hợp pháp nếu thiết lập cấu trúc hợp đồng đúng quy chuẩn.

Bài viết này sẽ phân tích chi tiết mức phí phổ biến trên thị trường, cách thiết kế hợp đồng hợp pháp và mô hình kinh doanh tối ưu nhất dành cho các Support Company (サポート会社).

---

## 1. Mức phí dịch vụ hỗ trợ đấu giá phổ biến trên thị trường Nhật Bản

Hiện nay, các công ty hỗ trợ đấu giá chuyên nghiệp thường áp dụng hai cấu trúc tính phí chính dưới đây:

### ① Phí tư vấn cố định (Định giá & Khảo sát ban đầu)
Đây là khoản phí để thực hiện việc khảo sát thực địa, phân tích hồ sơ Tòa án (三点セット) và lập phương án tài chính trước khi đấu giá.
*   **Mức phí thị trường**: từ 100,000 JPY đến 300,000 JPY (chưa thuế).
*   **Đặc điểm**: Khoản phí này phát sinh bất kể khách hàng có trúng thầu hay không, giúp doanh nghiệp trang trải chi phí vận hành và khảo sát ban đầu.

### ② Phí thành công (Thành công trúng thầu)
Khoản phí chỉ phát sinh khi khách hàng trúng thầu thành công tài sản đấu giá mục tiêu.
*   **Mức phí thị trường**: từ 3% đến 5% giá trị trúng thầu (hoặc giá trị thị trường của bất động sản đó).
*   **Đặc điểm**: Dễ dàng thuyết phục khách hàng ký kết vì họ không phải chịu rủi ro mất phí nếu đấu thầu thất bại.

---

## 2. Phương pháp pháp lý để thu phí ngoài hạn mức trần 3% + 6 vạn Yên

Hạn chế về phí môi giới của Luật Giao dịch Bất động sản chỉ áp dụng cho hành vi "môi giới" (媒介/仲介) mua bán. Trong giao dịch đấu giá tại Tòa án, Tòa án mới là bên thực hiện bán tài sản trực tiếp, và công ty của bạn không đóng vai trò môi giới mua bán giữa hai bên chủ thể thông thường.

Do đó, bạn hoàn toàn có thể ký kết **"Hợp đồng ủy thác nghiệp vụ tư vấn" (コンサルティング業務委託契約)** để thu các khoản phí hỗ trợ ngoài khung phí môi giới thông thường dựa trên các nghiệp vụ chuyên môn thực tế:

### 3 nguyên tắc cốt lõi để đảm bảo tính hợp pháp:
1.  **Sử dụng đúng loại hợp đồng**: Tuyệt đối không dùng các cụm từ "môi giới" (仲介/媒介) trong văn bản. Hợp đồng phải được định nghĩa rõ ràng là: "Hợp đồng ủy thác khảo sát thực địa, điều chỉnh quyền lợi và hỗ trợ bàn giao tài sản đấu giá".
2.  **Cung cấp dịch vụ chuyên môn thực tế**: Cần ghi nhận kết quả công việc bằng văn bản/báo cáo rõ ràng để chứng minh bạn thực sự cung cấp dịch vụ tư vấn sâu, bao gồm:
    *   Báo cáo phân tích rủi ro chiếm hữu và kế hoạch đàm phán giải phóng mặt bằng (明渡し).
    *   Bảng dự toán chi phí sửa chữa, cải tạo (リフォーム).
    *   Báo cáo pháp lý sau khi tra cứu hồ sơ vụ việc tại Tòa án sở tại.
3.  **Bóc tách rõ ràng cơ cấu chi phí**: Trong hợp đồng cần ghi rõ các hạng mục công việc ứng với khoản phí tương xứng thay vì chỉ ghi một khoản chung chung.

---

## Kết luận: Tận dụng Keibai Finder để tiếp cận khách hàng tiềm năng miễn phí

Để phát triển mảng kinh doanh hỗ trợ đấu giá, điểm then chốt là tiếp cận được nguồn khách hàng đang có nhu cầu gom mua nhà giá rẻ qua kênh đấu giá.

Tại [keibai-koubai.com](https://www.keibai-koubai.com), chúng tôi kết nối hàng vạn lượt người dùng tìm kiếm thông tin đấu giá mỗi tháng. Bằng cách đăng ký tài khoản Support Company miễn phí, doanh nghiệp của bạn sẽ được hiển thị trực tiếp ở vị trí nổi bật trên các trang chi tiết bất động sản thuộc khu vực hỗ trợ của bạn, giúp thu hút khách hàng liên hệ trực tiếp mà không tốn chi phí quảng cáo.

Hãy trang bị kiến thức pháp lý vững vàng và xây dựng quy trình tư vấn chuyên nghiệp để tạo lập nguồn doanh thu thứ hai vững chắc cho doanh nghiệp của bạn ngay hôm nay.`,
    content_en: `# How to Structure Keibai Support Fees: Legal Revenue Models That Exceed Brokerage Fee Limits

While many real estate agencies in Japan are interested in entering the foreclosure (Keibai) support market, the biggest barrier is often a misunderstanding regarding the legal limits of commission fees.

Under the Building Lots and Buildings Transaction Business Act (宅建業法 - Takken Law), standard brokerage commissions are strictly capped at "3% + 60,000 JPY" (plus tax) for standard real estate transactions. However, because foreclosure support services are fundamentally different from standard sales mediation (brokerage), agencies can legally charge consultation fees that exceed this brokerage cap by structuring their contracts correctly.

This article provides an in-depth guide on market fee standards, legal contract design, and the optimal monetization models for support companies (サポート会社).

---

## 1. Market Standards for Keibai Support Fees

Currently, the fees charged by professional foreclosure support agencies in Japan generally fall into two categories:

### ① Fixed Consultation Fee (Basic Survey & Valuation Fee)
This is a baseline fee covering pre-bid property investigation, "3-document set" (三点セット) analysis, rights-relationship clarification, and financial planning.
*   **Market Rate**: 100,000 JPY to 300,000 JPY (plus tax).
*   **Characteristics**: This fee is typically earned regardless of whether the client wins the auction. It is crucial for covering the agency's initial survey and administrative overhead costs.

### ② Success Fee (Successful Bid Commission)
This fee is charged only when the client successfully wins the auction and acquires the property.
*   **Market Rate**: 3% to 5% of the winning bid price (or the property's estimated market value).
*   **Characteristics**: This model is highly attractive and easy to pitch because the client faces zero cost risk if their bid fails.

---

## 2. Legal Approaches to Exceeding the 3% + 60,000 JPY Brokerage Cap

The commission caps under the Takken Law strictly apply only to "mediation/brokerage" (媒介/仲介) of sales transactions.

During a court auction, the support agency does not act as a broker between two parties, since the Court itself executes the sale. Therefore, by signing a **"Consulting Services Agreement" (コンサルティング業務委託契約)** for specialized tasks, the agency can legally receive consultation fees outside of the standard brokerage framework.

### Three Golden Rules for Legal Compliance:
1.  **Draft a Clear "Consulting Services Agreement"**
    When signing the contract, avoid terms like "brokerage" or "mediation" in the title or clauses. Clearly define it as a "Service Agreement for Property Investigation, Title Coordination, and Eviction Support in Foreclosure Auctions".
2.  **Provide Substantive Consulting Services**
    Do not simply fill out paperwork. You must provide actual professional services and document them in report formats:
    *   Eviction risk simulation and occupant negotiation advice.
    *   Renovation and repair cost estimations.
    *   Inspecting court records at the competent local court.
3.  **Specify the breakdown of consultation fees**
    Clearly list the exact scope of services corresponding to each fee in the contract rather than a single lump sum.

---

## Conclusion: Maximize Inquiries with Keibai Finder

To successfully grow your auction support business, the key is reaching buyers who are looking to purchase foreclosure properties early in their search process.

At [keibai-koubai.com](https://www.keibai-koubai.com), tens of thousands of active buyers search for auction listings every month. By registering as a partner Support Company for free, your company's contact window will be automatically promoted on property detail pages in your service areas, allowing you to capture high-intent inquiries directly without any advertising costs.

Equip your agency with the correct legal knowledge and professional consultation workflow to build a highly profitable second revenue stream today.`,
    content_zh: `# 竞标支持费用指南：房地产中介的合法商业模式

了解日本拍卖房产支持服务费用的 market 行情和法律界定是中介进入这一市场的关键。通过签署咨询委托合同，提供实地调查和过户协助等专业服务，中介可以合法地获得超出普通中介费上限的报酬。`
  },
  {
    slug: 'keibai-occupants-eviction-guide',
    category: 'CAUTION',
    tags: ['明渡し', '占有者', '強制執行', 'トラブル防止'],
    featuredImage: null,
    title_ja: '競売不動産の「明渡し（占有者対策）」実務ガイド：強制執行を避け、円満に立ち退き交渉を進めるプロのテクニック',
    title_vi: 'Nghiệp vụ giải phóng mặt bằng bất động sản đấu giá (Keibai): Kỹ thuật đàm phán tránh cưỡng chế hành chính',
    title_en: 'Foreclosure Eviction & Occupant Negotiation Guide: Professional Techniques to Avoid Forced Execution',
    title_zh: '拍卖房产腾退与占有者谈判实务指南',
    content_ja: `# 競売不動産の「明渡し（占有者対策）」実務ガイド：強制執行を避け、円満に立ち退き交渉を進めるプロのテクニック

競売不動産の購入にあたり、最も多くのトラブルが発生し、かつサポート会社としての専門性が問われるのが「占有者の退去および物件の明渡し（占有者対策）」です。

「安く落札できたものの、前の住人が頑なに立ち退かない」「裁判所の手続き（強制執行）は時間も費用もかかる」といった課題に対し、プロのサポート会社はどう対処すべきでしょうか。本記事では、裁判所の強制執行を避けて、円満かつスピーディーに立ち退き交渉を完了させるための実務ガイドを解説します。

---

## 1. 占有者のタイプ別アプローチ

物件に住み着いている人物（占有者）の属性によって、交渉のアプローチや難易度は大きく変わります。まずは三点セット（特に「現況調査報告書」）を読み解き、占有者のタイプを分類します。

### ① 所有者（元債務者）
借金返済が滞り、家を失うことになった元の所有者です。
*   **精神状態**: 遷移感や怒り、また引越し費用がないなど精神的・経済的に追い詰められているケースが多々あります。
*   **交渉のコツ**: 最初から法的手段を突きつけるのではなく、まずは相手の生活再建（新居の確保や引越し手配の支援）に寄り添う姿勢を見せることが早期解決の近道です。

### ② 賃借人（一般の入居者）
競売にかかった物件を借りて住んでいた入居者です。
*   **権利関係**: 抵当権の設定登記より前に賃貸借契約を結んでいた場合は「対抗力」がありますが、そうでない場合は落札から6ヶ月の明渡し猶予期間（猶予期間）の後に退去しなければなりません。
*   **交渉のコツ**: 法的な猶予期間（6ヶ月）について丁寧に説明しつつ、退去後の保証金返還や次の賃貸物件の仲介を提案することで、自社の別の収益機会につなげることができます。

---

## 2. 円満な明渡し交渉を進めるための「3ステップ」

法的な手段（引渡命令・強制執行）を最初から使うのではなく、任意の「話し合い」による円満解決（任意退去）を第一目標にします。

### ステップ1：ファーストコンタクトと挨拶（敵対しない）
落札後、代金を納付する前後の段階で現地を訪問します。
*   **姿勢**: 「落札したので出ていってください」という高圧的な態度ではなく、「新しくこの物件を引き継ぐことになりました。今後の手続きやご予定についてご相談させてください」と柔らかくアプローチします。
*   **目的**: 相手を刺激せず、現在の居住状況や退去の意図、経済的状況を聞き出すことが目的です。

### ステップ2：引越し支援（立ち退き料）の合意形成
占有者が出ていけない最大の理由は「新しい家を借りる初期費用がない」ことです。
*   **妥協点の提案**: 強制執行を行うと、裁判所への予納金や荷物の搬出費等で50万円〜100万円規模のコストがかかります。この費用を占有者の「引越し引当金（立ち退き料）」として一部提供することを提案します。
*   **相場**: 10万円 〜 30万円程度
*   **注意点**: 必ず「退去完了（鍵の引き渡し）と引き換えに現金（または振込）を支払う」旨の合意書を作成し、前払いは避けます。

### ステップ3：合意内容を書面化する（明渡し合意書の締結）
合意した退去日、引越し費用の額、残置物の処分権限などを盛り込んだ「明渡し合意書（念書）」を取り交わします。特に重要なのが「残された荷物の処分」についての同意です。「退去日以降に残った物品は、落札者が自由に処分してよい」旨の条項を必ず入れてください。

---

## 3. 最難関の事態に備えた法的安全網（引渡命令の同時申請）

どんなに円満な交渉を目指していても、相手が全く交渉に応じない、または行方をくらますリスクがあります。

そのため、代金納付を行ったら、**即座に「引渡命令（ひきわたしめいれい）」の申し立て**を裁判所に行います。
*   **理由**: 引渡命令の取得には通常数週間から1ヶ月程度かかります。交渉と並行して司法手続きを進めておくことで、「交渉が決裂した場合でも、いつでも次の法的ステップ（執行抗告、強制執行）に進める」という交渉のカードを持てるようになります。

---

## まとめ：サポート会社の腕の見せ所

物件の明渡し交渉は、ただの書類作成ではなく、人間関係の対話そのものです。ここで円満解決へ導けるスキルこそが、サポート会社が顧客から高いコンサルティング報酬を得られる真の価値です。

プロフェッショナルな対応を行い、競売投資のハードルを下げることで、より多くのリピーターを獲得していきましょう。`,
    content_vi: `# Nghiệp vụ giải phóng mặt bằng bất động sản đấu giá (Keibai): Kỹ thuật đàm phán tránh cưỡng chế hành chính

Trong quá trình đầu tư và hỗ trợ khách hàng mua bất động sản đấu giá (競売不動産) tại Nhật Bản, nghiệp vụ xử lý người chiếm hữu và bàn giao nhà (明渡し) là mảng phát sinh nhiều tranh chấp nhất, đồng thời cũng là thước đo năng lực chuyên môn của một công ty hỗ trợ (サポート会社).

"Đấu giá trúng căn nhà giá rất rẻ, nhưng chủ cũ nhất quyết không chịu dời đi", "Thủ tục yêu cầu Tòa án cưỡng chế thì vừa mất thời gian vừa tốn kém chi phí"... Để giải quyết các tình huống khó khăn này, các chuyên gia đàm phán bất động sản làm thế nào? Bài viết này sẽ hướng dẫn quy trình thực tế giúp đàm phán giải phóng mặt bằng nhanh chóng và êm đẹp mà không cần dùng đến biện pháp cưỡng chế cưỡng bức.

---

## 1. Phân loại đối tượng chiếm hữu để có cách tiếp cận phù hợp

Tùy vào thân phận của người đang sinh sống trong căn nhà trúng đấu giá (占有者), kỹ thuật đàm phán và mức độ phức tạp sẽ khác nhau. Bạn cần phân tích kỹ hồ sơ Tòa án (đặc biệt là Báo cáo khảo sát thực trạng - 現況調査報告書) để nhận diện đối tượng:

### ① Chủ sở hữu cũ (Con nợ - 元債務者)
Là những người bị siết nợ và mất quyền sở hữu căn nhà.
*   **Trạng thái tâm lý**: Dễ rơi vào cảm giác mất mát, tức giận, hoặc kiệt quệ tài chính (không có tiền chuyển nhà).
*   **Mẹo đàm phán**: Tránh dùng các điều khoản pháp lý đe dọa ngay từ đầu. Hãy lắng nghe và đề xuất giải pháp hỗ trợ họ tìm nơi ở mới phù hợp với khả năng tài chính để tạo thiện cảm và giải quyết nhanh vụ việc.

### ② Người thuê nhà (一般の入居者)
Là người thuê lại căn nhà từ chủ cũ để sinh sống.
*   **Quyền lợi pháp lý**: Nếu hợp đồng thuê được ký trước khi bất động sản bị thế chấp, họ có quyền kháng nghị. Nếu ký sau, họ được phép lưu trú tối đa 6 tháng kể từ ngày trúng đấu giá (Thời gian gia hạn bàn giao - 明渡し猶予期間).
*   **Mẹo đàm phán**: Giải thích cặn kẽ quyền lợi và nghĩa vụ pháp lý trong thời gian 6 tháng. Bạn có thể đề nghị làm môi giới giới thiệu căn hộ cho thuê mới cho họ để chuyển tiếp êm đẹp, đồng thời tăng doanh thu môi giới cho công ty của mình.

---

## 2. Quy trình 3 bước đàm phán bàn giao nhà êm đẹp (任意退去)

Ưu tiên hàng đầu luôn là đạt được sự đồng thuận tự nguyện chuyển đi (任意退去) thông qua thương lượng, tránh khởi động quy trình cưỡng chế của Tòa án.

### Bước 1: Tiếp cận ban đầu lịch sự (Không gây đối đầu)
Sau khi trúng đấu giá, hãy đến thăm nhà và gặp trực tiếp người chiếm hữu.
*   **Thái độ**: Thay vì nói gay gắt "Chúng tôi đã mua căn nhà này, yêu cầu ông/bà dời đi ngay", hãy nói nhẹ nhàng: "Chào ông/bà, chúng tôi là đơn vị tiếp nhận bàn giao căn nhà này từ Tòa án. Chúng tôi đến để lắng nghe dự định và cùng thảo luận phương án hỗ trợ ông/bà chuyển dọn thuận lợi nhất".
*   **Mục tiêu**: Tìm hiểu hoàn cảnh thực tế, nguyện vọng và thời gian họ mong muốn chuyển đi để lên kế hoạch.

### Bước 2: Hỗ trợ chi phí di dời (立ち退き料) hợp lý
Lý do lớn nhất khiến người chiếm hữu chưa chịu đi là họ không có sẵn tiền để thuê nhà mới.
*   **Đề xuất kinh tế**: Nếu làm thủ tục cưỡng chế, bạn sẽ mất từ 500,000 JPY đến 1,000,000 JPY phí tạm ứng cho Tòa án và thuê nhân công dọn đồ. Hãy trích một phần chi phí này (khoảng 100,000 JPY đến 300,000 JPY) làm "Phí hỗ trợ di dời" tặng trực tiếp cho họ.
*   **Lưu ý quan trọng**: Tuyệt đối không trả trước. Chỉ giao tiền khi họ dọn sạch đồ đạc và bàn giao lại chìa khóa nhà.

### Bước 3: Ký kết biên bản thỏa thuận bàn giao nhà (明渡し合意書)
Lập văn bản ghi nhận rõ ràng ngày chuyển đi, số tiền hỗ trợ, và đặc biệt là điều khoản xử lý đồ đạc còn sót lại (残置物). Cần ghi rõ: *"Sau ngày thỏa thuận, những đồ đạc còn lại trong nhà sẽ do bên mua toàn quyền định đoạt và xử lý"*, để tránh rắc rối kiện cáo tài sản về sau.

---

## 3. Xây dựng lá chắn pháp lý phòng ngừa rủi ro

Trong lúc đàm phán, luôn chuẩn bị phương án dự phòng nếu đối phương bất hợp tác hoặc cố tình kéo dài thời gian.

*   Ngay khi nộp đủ tiền mua nhà, hãy lập tức nộp đơn xin **Lệnh bàn giao nhà (引渡命令 - Hikiwatoshi Meirei)** lên Tòa án.
*   Thủ tục này mất khoảng vài tuần đến 1 tháng để được phê duyệt. Việc có sẵn Lệnh bàn giao sẽ là đòn bẩy pháp lý mạnh mẽ giúp cuộc đàm phán của bạn có sức nặng hơn rất nhiều.

---

## Kết luận

Nghiệp vụ giải phóng mặt bằng đấu giá đòi hỏi sự khéo léo trong giao tiếp nhân sự hơn là những quy định khô khan. Giải quyết êm đẹp khâu này chính là giá trị cốt lõi giúp Support Company khẳng định vị thế và thu được phí tư vấn xứng đáng từ khách hàng.`,
    content_en: `# Foreclosure Eviction & Occupant Negotiation Guide: Professional Techniques to Avoid Forced Execution

When helping clients purchase foreclosure (Keibai) properties in Japan, the step that carries the highest risk of disputes and requires the utmost professional expertise is "occupant eviction and property handover" (明渡し).

Faced with common issues such as "the previous occupant refuses to move out despite a cheap winning bid" or "court-ordered eviction (強制執行) is too slow and costly," how do expert agencies handle the process? This guide details how professional support companies manage occupant negotiations to achieve peaceful, swift relocation without resorting to court-ordered enforcement.

---

## 1. Segmenting Occupants for the Right Negotiating Approach

The negotiation approach and difficulty vary significantly depending on the background of the person currently living in the property (占有者). First, analyze the court's "3-document set" (specifically the Status Report) to categorize the occupant:

### ① Owner (Former Debtor)
The original owner who lost their home due to unpaid debts.
*   **Mental State**: Often experiences a high level of loss, anger, or extreme financial distress (lacking moving funds).
*   **Negotiation Tip**: Do not threaten them with legal actions from day one. Showing empathy and assisting them in securing their next apartment or arranging moving services is the fastest path to a peaceful resolution.

### ② Tenant (General Renters)
A renter who occupied the property under a lease agreement with the former owner.
*   **Legal Rights**: If their lease was registered before the mortgage, they have counter-rights. Otherwise, they must vacate after a 6-month grace period (明渡し猶予期間) from the auction date.
*   **Negotiation Tip**: Explain their legal rights and the 6-month grace period clearly. Offer to act as a broker to find their next rental home, turning a potential dispute into a new brokerage transaction for your agency.

---

## 2. A 3-Step Process for Peaceful Eviction (任意退去)

Rather than starting with legal enforcement (eviction order), prioritize achieving a voluntary relocation through peaceful negotiation.

### Step 1: Initial Polite Contact (Avoid Hostility)
Visit the property around the time of the bid payment.
*   **Attitude**: Avoid aggressive statements like "We bought this house, get out." Instead, say: "Hello, we have taken over the custody of this property. We would like to discuss your moving plans and see how we can assist you to make the transition as smooth as possible."
*   **Goal**: Gather information on their current living situation, moving intent, and financial conditions without triggering defensiveness.

### Step 2: Agreeing on Moving Assistance (Relocation Allowance)
The primary reason occupants do not leave is that they lack the upfront capital to lease a new apartment.
*   **Financial Compromise**: Forced court execution costs between 500,000 JPY and 1,000,000 JPY in court deposits and moving labor. Propose providing a portion of this cost (usually 100,000 JPY to 300,000 JPY) directly to the occupant as a "moving allowance" (立ち退き料).
*   **Key Rule**: Never pay in advance. Only transfer the funds after they have completely cleared the property and handed over the keys.

### Step 3: Formalize the Relocation Agreement
Draft a formal "Relocation Agreement" detailing the agreed moving date, the allowance amount, and a waiver of ownership of any abandoned items (残置物). Ensure the agreement states that "any items remaining on the property after the moving date can be disposed of by the buyer without liability."

---

## 3. Creating a Legal Safety Net (Filing for an Eviction Order)

No matter how smoothly you expect negotiations to go, there is always a risk that the occupant disappears or refuses all communication.

Therefore, immediately after paying for the property, **file for a court Eviction Order (引渡命令 - Hikiwatoshi Meirei)**.
*   **Reason**: Obtaining the order takes several weeks to a month. Running this judicial process in parallel with negotiations gives you a strong legal card if negotiations break down.

---

## Conclusion

Resolving occupant evictions is a delicate exercise in human communication rather than just legal paperwork. Successfully navigating this process is the true value that allows support companies to earn high consulting fees from their clients.`,
    content_zh: `# 拍卖房产腾退与占有者谈判实务指南

腾退占有者是购买法拍房时最容易发生纠纷的环节。本指南介绍了如何通过平等的沟通促成占有者自愿搬离，如何合理提供搬迁补偿，以及如何通过法院的“引渡命令”构筑法律防线。`
  },
  {
    slug: 'keibai-survey-efficiency-dx-tools',
    category: 'GUIDE',
    tags: ['不動産DX', 'KeibaiLens', '物件調査', '業務効率化'],
    featuredImage: null,
    title_ja: '無料ツールとGoogle拡張機能（Keibai Lens）で調査時間を8割削減する方法',
    title_vi: 'Ứng dụng công nghệ DX: Rút ngắn 80% thời gian khảo sát thực địa bằng Extension Keibai Lens',
    title_en: 'How to Cut Property Research Time by 80% with Free Tools and Keibai Lens',
    title_zh: '利用 Chrome 插件 Keibai Lens 缩短 80% 的房产调查时间',
    content_ja: `# 無料ツールとGoogle拡張機能（Keibai Lens）で調査時間を8割削減する方法

不動産競売ビジネスにおいて、最も時間と労力がかかるステップの一つが「物件の下調べとリスク分析」です。

裁判所から開示される三点セットの読み込みに加え、周囲の取引相場、ハザードマップの確認、道路付けの調査など、1物件あたり数時間を要することも珍しくありません。この業務負担をデジタル技術（不動産DX）によって劇的に効率化し、調査時間を8割削減する手法について実務視点から解説します。

---

## 1. 競売調査における「3つの時間泥棒」とその解決策

競売物件のスクリーニングにおいて、多くのサポート会社が以下の作業に時間を取られています。

1.  **裁判所サイト（BIT）と相場サイトの行き来**
    BITで物件情報を確認しながら、公示地価や国土交通省の取引履歴サイト（MLIT）を別タブで開き、住所を手入力して検索する作業。
2.  **ハザードマップの個別確認**
    浸水リスクや土砂災害警戒区域に入っているかを調べるため、自治体の防災マップを検索し直す作業。
3.  **周辺競売物件の過去落札データの検索**
    同じマンションや近隣エリアで過去にいくらで落札されたかを、Excelシートや過去ログから手探りで探す作業。

これらをすべて自動化またはワンクリックに集約することが、DX化の第一歩です。

---

## 2. Google Chrome拡張機能「Keibai Lens」の衝撃

弊社が提供する無料のChrome拡張機能「**Keibai Lens**」は、まさに上記の課題を解決するために開発されました。

### 主な機能と実務での活用法

*   **取引相場データの自動マッチング**
    裁判所のBIT物件ページを開くだけで、その物件の周辺で行われた過去の不動産取引事例（国土交通省データ）が画面上に自動でマッピング・リスト表示されます。住所をコピペして別サイトで検索し直す必要はもうありません。
*   **ハザードマップレイヤーの即時重ね合わせ**
    物件周辺の地図上に、土砂災害警戒区域や洪水浸水想定区域のレイヤーをワンクリックで重ねて表示できます。調査開始からわずか3秒で、自然災害リスクの一次審査が完了します。
*   **過去の競売落札データの呼び出し**
    近隣で過去に発生した競売の入札件数や平均落札価格をグラフ化して表示します。

---

## 3. 自社業務に導入する具体的なフロー

明日からの物件調査フローを以下のようにアップデートしてください。

1.  **「Keibai Lens」拡張機能をインストール（無料）**
2.  **BITで対象物件のページを開く**
    拡張機能が自動起動し、右側に詳細な分析パネル（相場、ハザード、落札データ）が表示されます。
3.  **PDF三点セットをダウンロードして重要ワードのみスキャン**
    基本調査は拡張機能のデータで終わっているため、PDFの閲覧は「占有関係の特記事項」と「内覧写真の瑕疵」の確認だけに集中できます。

これだけで、従来1物件あたり約40〜60分かかっていた調査が、**わずか5〜10分**で完了するようになります。

---

## まとめ：調査の超高速化がもたらすビジネス上のメリット

調査時間が削減されることで、サポート会社には以下の大きなアドバンテージ（メリット）が生まれます。

*   **取り扱い物件数の最大化**: 少ない人数で多くの物件をスクリーニングでき、顧客への提案数が増加します。
*   **提案スピードの向上**: 新着物件が出てから数分で顧客に対して簡易調査レポート付きの提案メールを送ることが可能になります。

まずは無料の「Keibai Lens」をブラウザに導入し、その圧倒的な効率化を実感してください。`,
    content_vi: `# Ứng dụng công nghệ DX: Rút ngắn 80% thời gian khảo sát thực địa bằng Extension Keibai Lens

Trong lĩnh vực kinh doanh hỗ trợ đấu giá bất động sản tại Nhật Bản, một trong những bước tiêu tốn nhiều thời gian và công sức nhất chính là "Khảo sát thông tin ban đầu và phân tích rủi ro tài sản".

Bên cạnh việc nghiên cứu kỹ bộ 3 hồ sơ Tòa án (三点セット), các chuyên viên khảo sát còn phải tra cứu giá thị trường xung quanh, bản đồ rủi ro thiên tai (Hazard Map), tình trạng đường xá... Việc này mất từ 2 đến 3 tiếng cho mỗi bất động sản là chuyện bình thường. Nhờ sự hỗ trợ của công nghệ số (Bất động sản DX), quy trình này có thể được tối ưu hóa vượt bậc, giúp rút ngắn 80% thời gian nghiên cứu. Hãy cùng tìm hiểu phương pháp thực tế ngay dưới đây.

---

## 1. 3 rào cản tiêu tốn thời gian nhất trong khảo sát đấu giá và cách khắc phục

Nhiều công ty hỗ trợ bất động sản (Support Company) đang bị lãng phí nguồn lực vào các công việc lặp đi lặp lại:

1.  **Chuyển đổi liên tục giữa trang web Tòa án (BIT) và trang tra cứu giá thị trường**
    Vừa đọc thông tin trên BIT, vừa phải copy địa chỉ rồi paste sang các trang bản đồ giá đất hoặc trang thông tin giao dịch của Bộ Đất đai (MLIT) ở tab trình duyệt khác để so sánh.
2.  **Tra cứu bản đồ phòng chống thiên tai (Hazard Map) thủ công**
    Để xem bất động sản có nằm trong vùng nguy cơ sạt lở hoặc ngập lụt không, nhân viên phải vào website phòng chống thiên tai của địa phương đó và tìm kiếm địa chỉ lại từ đầu.
3.  **Truy tìm lịch sử giá trúng thầu của các tài sản đấu giá cũ xung quanh**
    Lục tìm các file Excel lưu trữ hoặc nhật ký giao dịch cũ để xem trong cùng tòa nhà hoặc khu vực lân cận trước đây các tài sản đã trúng thầu với mức giá bao nhiêu.

Tích hợp tất cả các nguồn dữ liệu này vào một màn hình duy nhất là bước đi đầu tiên trong chiến lược Chuyển đổi số (DX).

---

## 2. Tiện ích Chrome "Keibai Lens" - Giải pháp đột phá cho doanh nghiệp

Tiện ích miễn phí **Keibai Lens** được phát triển nhằm mục tiêu giải quyết triệt để các rào cản nêu trên:

### Các tính năng cốt lõi và ứng dụng thực tế:

*   **Tự động khớp dữ liệu giá giao dịch thực tế**:
    Khi mở trang chi tiết bất động sản trên website Tòa án (BIT), tiện ích sẽ tự động truy xuất và hiển thị trực tiếp danh sách kèm bản đồ các giao dịch bất động sản thực tế xung quanh do Bộ Đất đai (MLIT) cung cấp. Không cần copy-paste địa chỉ nữa.
*   **Tích hợp lớp bản đồ Hazard Map tức thì**:
    Chỉ với một cú click, bản đồ nguy cơ sạt lở đất cát hoặc ngập lụt sông ngòi sẽ được chồng đè (layer) trực tiếp lên bản đồ vị trí bất động sản. Bạn có thể đánh giá rủi ro thiên tai chỉ trong 3 giây.
*   **Hiển thị biểu đồ phân tích giá trúng thầu quá khứ**:
    Xem nhanh số lượng hồ sơ nộp thầu và mức giá trúng thầu trung bình của các vụ đấu giá cũ cùng khu vực.

---

## 3. Quy trình áp dụng hiệu quả cho doanh nghiệp của bạn

Hãy nâng cấp quy trình khảo sát bất động sản từ ngày mai theo các bước đơn giản sau:

1.  **Cài đặt tiện ích Chrome "Keibai Lens" (Hoàn hoàn miễn phí)**.
2.  **Mở trang chi tiết tài sản đấu giá trên BIT**.
    Bảng phân tích thông minh của Keibai Lens sẽ tự động hiển thị ở góc bên phải màn hình (bao gồm giá giao dịch lân cận, Hazard Map, và lịch sử trúng thầu).
3.  **Tải bộ 3 hồ sơ PDF và chỉ tập trung quét các thông tin đặc biệt**.
    Do các bước khảo sát cơ bản đã được tiện ích thực hiện tự động, bạn chỉ cần dành 5 phút đọc PDF để kiểm tra các ghi chú về tranh chấp chiếm hữu hoặc lỗi hư hỏng nội thất trong ảnh chụp.

Nhờ đó, thời gian khảo sát mỗi tài sản sẽ giảm từ 40 - 60 phút xuống chỉ còn **5 đến 10 phút**.

---

## Kết luận

Việc rút ngắn tối đa thời gian khảo sát thông tin giúp Support Company nâng cao năng lực cạnh tranh rõ rệt: tối đa hóa số lượng bất động sản có thể tư vấn cho khách hàng và gửi báo cáo phân tích nhanh chóng ngay khi có tin đấu giá mới.

Hãy bắt đầu cài đặt tiện ích Keibai Lens ngay hôm nay để trải nghiệm sự đột phá về hiệu suất công việc.`,
    content_en: `# How to Cut Property Research Time by 80% with Free Tools and Keibai Lens

In the foreclosure real estate business, one of the most time-consuming and labor-intensive steps is "preliminary investigation and risk analysis."

Analyzing the court's three-document sets, checking transaction history, examining hazard maps, and investigating road rights can take several hours per listing. This guide explains how to dramatically optimize this workflow using digital technology (Real Estate DX) to cut your research time by 80%.

---

## 1. The "Three Time-Wasters" in Foreclosure Property Investigation

When screening auction properties, support agencies frequently waste hours on the following repetitive manual tasks:

1.  **Switching between the Court website (BIT) and market transaction sites**
    Copying addresses from the court page, opening the Ministry of Land's (MLIT) transaction site in a new tab, and typing the address manually to compare prices.
2.  **Checking Hazard Maps individually**
    Searching for local government disaster maps to see if the property is located in landslide-alert zones or floodplains.
3.  **Searching past auction histories**
    Digging through historical spreadsheets or past logs to find out how much comparable units in the same building or neighborhood were sold for in previous auctions.

Automating these steps or consolidating them into a single window is the first step toward business optimization.

---

## 2. A Game Changer: Google Chrome Extension "Keibai Lens"

Our free Chrome extension, **Keibai Lens**, was developed specifically to solve these efficiency bottlenecks.

### Core Features and Practical Business Application

*   **Automated Market Data Matching**
    Simply open the court's BIT listing page. The extension automatically maps and displays recent real estate transaction records (sourced directly from MLIT) on your screen. There is no need to copy-paste addresses anymore.
*   **One-Click Hazard Map Overlay**
    Instantly overlay landslide warning areas and flood inundation risk zones directly on the property map. Perform your natural disaster risk assessment in under 3 seconds.
*   **Past Bidding Statistics**
    Visualize the average winning bids and bidding counts in the neighborhood with clean charts.

---

## 3. How to Upgrade Your Daily Workflow

Upgrade your property investigation routine using these simple steps:

1.  **Install the "Keibai Lens" Extension (Free)**.
2.  **Open the property listing page on BIT**.
    The extension panel will launch automatically on the right side of the screen, loading all the comparative market data, hazard layers, and bidding charts.
3.  **Scan the PDF Three-Document Set only for critical terms**.
    Since the base survey is already complete, you can focus your manual reading solely on special occupant clauses or specific property interior defects.

This upgrade slashes your investigation time per property from 45–60 minutes down to **5 to 10 minutes**.

---

## Conclusion

Reducing research times yields substantial business advantages:

*   **Maximizing Listing Volume**: Screen more properties with fewer staff, increasing the number of recommendations you can offer to clients.
*   **Faster Client Pitching**: Send high-quality property recommendations with analytical reports to your clients within minutes of a new listing's release.

Install the free "Keibai Lens" extension in your browser today to experience this massive boost in operational speed.`,
    content_zh: `# 使用 DX 工具缩短法拍房调查时间

本指南介绍房地产中介如何使用免费 Chrome 浏览器插件 “Keibai Lens” 自动结合灾害地图、周边交易行情及拍卖历史，将每套法拍房的预先评估时间从 1 小时大幅缩短至 5 分钟。`
  }
];

async function main() {
  console.log('Inserting blog articles into database...');
  for (const art of articles) {
    const res = await prisma.dailyDigest.upsert({
      where: { slug: art.slug },
      update: {
        category: art.category,
        tags: art.tags,
        featuredImage: art.featuredImage,
        title_ja: art.title_ja,
        title_vi: art.title_vi,
        title_en: art.title_en,
        title_zh: art.title_zh,
        content_ja: art.content_ja,
        content_vi: art.content_vi,
        content_en: art.content_en,
        content_zh: art.content_zh,
      },
      create: {
        slug: art.slug,
        category: art.category,
        tags: art.tags,
        featuredImage: art.featuredImage,
        title_ja: art.title_ja,
        title_vi: art.title_vi,
        title_en: art.title_en,
        title_zh: art.title_zh,
        content_ja: art.content_ja,
        content_vi: art.content_vi,
        content_en: art.content_en,
        content_zh: art.content_zh,
      }
    });
    console.log(`Upserted article: ${res.slug} (ID: ${res.id})`);
  }
  console.log('Finished inserting blog articles successfully!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
