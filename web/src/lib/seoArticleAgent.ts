import { prisma } from '@/lib/prisma';
import { 
  getNextBestSeoTopic, 
  KEIBAI_TREND_DATABASE, 
  KeibaiTrendKeyword,
  TrendCategory 
} from '@/lib/keibaiTrendEngine';
import { revalidatePath } from 'next/cache';

export interface SeoAgentRunOptions {
  keywordId?: string;
  category?: TrendCategory;
  forceCategory?: 'GUIDE' | 'CAUTION' | 'MARKET_REPORT';
  dryRun?: boolean;
  llmModel?: string;
}

export interface SeoAgentRunResult {
  success: boolean;
  action: 'CREATED' | 'UPDATED' | 'DRY_RUN';
  article: {
    id?: string;
    slug: string;
    title: string;
    category: string;
    tags: string[];
    featuredImage: string;
    characterCount: number;
    url: string;
    publishedAt: string;
  };
  seoIntelligence: {
    primaryKeyword: string;
    monthlySearchVolume: number;
    growthMoM: string;
    intent: string;
    targetAudience: string;
    linkedToolsCount: number;
    generationSource: 'GEMINI_AI' | 'OPENAI_AI' | 'AUTONOMOUS_SYNTHESIZER';
  };
  durationMs: number;
}

// Thư viện ảnh bìa B2B theo ngữ cảnh chủ đề
const COVER_IMAGE_MAP: Record<string, string> = {
  'AREA_DEAL': '/blogs/market-insights-cover.png',
  'HIGH_YIELD_TYPE': '/blogs/trade-find-cover.png',
  'RISK_AND_LEGAL': '/blogs/caution-risk-occupants.png',
  'BIDDING_PROCEDURE': '/blogs/auction-guide-cover.png',
  'KOUBAI_TAX': '/blogs/keibai-vs-koubai.png',
  'DEFAULT': '/blogs/auction-guide-cover.png'
};

/**
 * Sinh nội dung bài viết chuyên sâu qua LLM ngoài (Gemini / OpenAI) nếu có API key
 */
async function generateViaLlm(
  topic: KeibaiTrendKeyword & { dbAssetCount: number },
  prompt: string
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 4096
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.length > 500) {
          return text;
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to autonomous engine:', err);
    }
  }

  if (openAiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'あなたは日本の不動産競売・公売および宅建業務に精通したシニアB2Bアナリスト兼SEO専門家です。読者に実務価値の高い、公的データに基づいた高品質な日本語Markdown記事を作成してください。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.6
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.length > 500) {
          return text;
        }
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to autonomous engine:', err);
    }
  }

  return null;
}

/**
 * Cỗ máy Tự hành Tổng hợp Chuyên sâu (Autonomous Expert Synthesizer)
 * Tự động tạo bài viết chuẩn SEO B2B Nhật Bản 2,500+ ký tự dựa trên pháp luật và dữ liệu thực tế
 */
function synthesizeExpertArticle(
  topic: KeibaiTrendKeyword & { dbAssetCount: number }
): { title: string; content: string } {
  const kw = topic.keyword;
  const pref = topic.prefecture || '全国';
  const assetCount = topic.dbAssetCount || 457;
  const growth = topic.growthMoM;
  const currentYear = 2026;

  let title = '';
  if (topic.category === 'AREA_DEAL') {
    title = `【${currentYear}年最新】${kw}の相場動向と落札攻略法｜${pref}エリアの掘り出し物件発掘ガイド`;
  } else if (topic.category === 'HIGH_YIELD_TYPE') {
    title = `【利回り20%超の狙い方】${kw}完全マニュアル｜失敗しないリノベーションと収益化戦略`;
  } else if (topic.category === 'RISK_AND_LEGAL') {
    title = `【初心者必見】${kw}と法務リスクの全知識｜トラブルを未然に防ぐプロのチェックリスト`;
  } else if (topic.category === 'BIDDING_PROCEDURE') {
    title = `【${currentYear}年版】${kw}の手続き完全ガイド｜裁判所競売で勝つための入札価格決定術`;
  } else {
    title = `【徹底解説】${kw}の仕組みと買い方｜公売物件で市場価格より安く資産形成する方法`;
  }

  const content = `
# ${title}

日本の不動産市場において、今「**${kw}**」に対する検索需要が前月比 **+${growth}%** と急上昇しています。
物価高や金利上昇局面において、一般的な流通市場よりも割安に優良な不動産を取得できる手段として、個人投資家から実需のマイホーム購入希望者、さらには宅建業者まで幅広い層が競売・公売市場に注目しています。

現在、Keibai Finderのデータベース上には、${pref}に関連する物件をはじめ全国 **${assetCount.toLocaleString()}件** の競売・公売物件がリアルタイムで集約されています。
本稿では、プロの不動産投資家や専業宅建業者が実践している「${kw}」の具体的な目利き術と、失敗しないためのデューデリジェンス手順を公的データに基づいて体系的に解説します。

---

## 1. なぜ今「${kw}」の検索需要が急増しているのか？

現在、GoogleおよびYahoo! Japanにおける「${kw}」の月間検索ボリュームは **${topic.monthlySearchVolume.toLocaleString()}回** を記録しており、市場の関心は極めて高い水準にあります。

この背景には、以下の3つの市場構造の変化があります。

1. **実勢市場価格と売却基準価額の乖離（価格ギャップ）**:
   裁判所の競売物件や国税庁の公売物件は、市場流通価格の **約60%〜70%** を基準に設定されることが多く、一般市場では予算内で購入できないエリアの物件が射程圏内に入ります。
2. **再生需要の高まり（DIY・リノベーション・民泊）**:
   特に「${topic.targetAudience}」にとって、築古戸建てや区分マンションを安価に落札し、自ら手を加えることで高い実質利回りを確保する投資モデルが確立されています。
3. **物件調査DXの進展**:
   これまで裁判所の閲覧室や現地調査に膨大な時間を要していた情報収集が、[エリア分析マップ](/area-map) や [不動産取引価格検索](/trade-find) などのオンラインツールによって即座に可視化できるようになったことが後押ししています。

---

## 2. 投資家・購入希望者が押さえるべき重要論点

「${kw}」を検討するにあたり、以下の重要事項について綿密な事前調査が欠かせません。

${topic.keyQuestions.map((q, idx) => `### Q${idx + 1}. ${q}
- **実務上のポイント**: 裁判所が公示する評価書の近隣取引事例のみに頼るのではなく、国土交通省の公式取引データと突合して直近3ヶ月〜6ヶ月以内の成約坪単価を把握することが不可欠です。
- **推奨アプローチ**: 当サイトの [市場分析ダッシュボード](/market-insights) を活用し、対象地域の平均落札倍率（基準価額に対する実落札額の比率）を事前に確認してください。`).join('\n\n')}

---

## 3. 「3点セット」と法的リスクのチェックマニュアル

競売物件の成否を分ける最大の分水嶺は、裁判所が発行する「**3点セット（物件明細書・現況調査報告書・評価書）**」の精読にあります。

| 確認項目 | チェックポイント | 実務上の注意事項 |
| :--- | :--- | :--- |
| **買受人が引き受けるべき権利** | 物件明細書の最下欄 | 担保権は代金納付で抹消されますが、対抗要件のある賃借権や地役権は引き受ける必要があります。 |
| **占有者の属性と引渡リスク** | 現況調査報告書の聞き取り記録 | 所有者（債務者）本人の占有か、第三者・賃借人の占有かを確認。明渡し交渉が難航した場合は引渡命令（民事執行法第83条）の申立てが必要です。 |
| **建物の維持管理・残置物** | 現況調査報告書のカラー写真 | 給排水管の漏水や雨漏り痕、室内の残置物の総量を確認。残置物処理費用は1立方米あたり約1万〜1.5万円を見積もります。 |
| **管理費・修繕積立金の滞納** | 管理会社への報告事項 | マンションの場合、区分所有法第8条に基づき特定承継人（落札者）に滞納管理費等の支払義務が発生します。 |

---

## 4. 国土交通省オープンデータと突合する「実勢価格・利回り査定術」

表面的な安さだけに目を奪われ、相場より高い価格で入札してしまう「高値掴み」を避けるためには、国土交通省（MLIT）の実際の成約事例との対比が不可欠です。

Keibai Finderでは、[不動産取引価格情報検索ツール](/trade-find) を通じて、対象不動産の近隣で成立した過去数千件の公的取引実績をワンクリックで照会できます。

### 失敗しないための「勝ち筋の入札算式」:
\`\`\`
許容入札上限額 ＝ （近隣の適正市場流通価格 × 0.80） － 想定リフォーム費用 － 残置物撤去費 － 滞納承継費用
\`\`\`

この計算式で算出した上限額を上回らない厳格な入札規律を守ることが、長期にわたり安定したキャッシュフローを生み出す鉄則です。

---

## 5. 自然災害リスクと都市計画（用途地域・建ぺい率・容積率）の照合

落札後に「思っていたようなリノベーションができない」「再建築が不可能な土地だった」「浸水リスクが極めて高いエリアだった」といった致命的な見落としを防ぐため、事前の地域環境調査を徹底してください。

当サイトの [不動産エリア分析マップ](/area-map) では、以下の公的情報を住所入力だけで一元診断できます。

- **国土交通省・国土地理院 重ねるハザードマップ**:
  洪水浸水想定区域、土砂災害警戒区域、津波浸水想定、高潮リスク。
- **都市計画・用途地域マップ**:
  全13種類の用途地域（第一種住居地域、商業地域、工業地域など）と指定建蔽率・容積率制限。

購入を希望する不動産の地盤や法的制限を事前に把握しておくことで、将来の売却時（イグジット）における資産価値の毀損を防ぐことができます。

---

## 6. まとめ：賢く落札するための具体的アクションプラン

「**${kw}**」における成功の秘訣は、**客観的な公的データに基づく徹底した下調べ** と **迅速な入札手続きの実行** に尽きます。

### 次のステップとして推奨される行動:
1. **物件を探す**: [全国競売・公売物件マップ検索](/) で、${pref}をはじめとする最新の公示案件を検索する。
2. **入札スケジュールを確認**: [売却スケジュールカレンダー](/auction/schedule) で、入札期間の開始日と開札期日をチェックする。
3. **専門会社への相談**: 占有者の明渡し交渉や3点セットの精査に不安がある場合は、[全国の宅建免許保有不動産会社データベース](/agencies) から、認証パートナー（落札サポート・入札代行専門会社）へ無料相談を行う。

---

> ### 💡 競売入札・現地調査・明渡し交渉でお困りの方へ
> Keibai Finderでは、入札代行から法務確認、落札後のリフォームまでワンストップでサポート可能な **公式認証宅建業者** をご紹介しています。面倒な手続きをプロに任せたい方は、各物件ページまたは [不動産会社一覧](/agencies) よりお気軽にご相談ください。
`;

  return { title, content };
}

/**
 * Lớp điều hành AI SEO Agent
 */
export class SeoArticleAgent {
  /**
   * Chạy quy trình tự động chọn từ khóa, viết bài và xuất bản
   */
  static async run(options?: SeoAgentRunOptions): Promise<SeoAgentRunResult> {
    const startTime = Date.now();

    // 1. Xác định chủ đề từ khóa mục tiêu
    let targetTopic: KeibaiTrendKeyword & { dbAssetCount: number };
    
    if (options?.keywordId) {
      const found = KEIBAI_TREND_DATABASE.find(k => k.id === options.keywordId || k.keyword === options.keywordId);
      if (!found) {
        throw new Error(`Keyword with id "${options.keywordId}" not found in trend database`);
      }
      targetTopic = { ...found, dbAssetCount: 457 };
    } else {
      targetTopic = await getNextBestSeoTopic({
        category: options?.category
      });
    }

    // 2. Chuẩn bị prompt cho AI hoặc Synthesizer
    const prompt = `
【指示】
あなたは日本の不動産競売・公売および宅建業務に精通したシニアB2Bアナリスト兼SEO専門家です。
以下のトレンドキーワードおよび実需データを基に、日本の不動産投資家・実需購入者が検索した際に絶大な信頼を寄せる、2,500文字以上の高品質な日本語Markdown記事（実務ガイド・コラム）を作成してください。

【対象キーワード情報】
- 主要キーワード: ${targetTopic.keyword}
- カテゴリ: ${targetTopic.categoryLabel}
- 月間検索ボリューム: ${targetTopic.monthlySearchVolume.toLocaleString()}回/月
- 前月比成長率: +${targetTopic.growthMoM}%
- 検索意図: ${targetTopic.intent}
- ターゲット読者: ${targetTopic.targetAudience}
- 関連地域: ${targetTopic.prefecture || '全国'}
- DB内関連物件数: 約${targetTopic.dbAssetCount}件

【読者が知りたい疑問・課題】
${targetTopic.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

【必須要件】
1. タイトルは「# 【2026年最新】${targetTopic.keyword}...」の形式で、CTRの高い魅力的かつ厳格なタイトルにすること。
2. 本文中にKeibai Finderの公式ツールへの自然な内部リンク（Internal Link Silo）を最低4箇所設置すること：
   - 不動産取引価格検索: [不動産取引価格検索](/trade-find)
   - エリア分析マップ: [エリア分析マップ](/area-map)
   - 市場分析ダッシュボード: [市場分析ダッシュボード](/market-insights)
   - 提携不動産会社: [不動産会社を探す](/agencies)
   - 売却スケジュール: [売却スケジュールカレンダー](/auction/schedule)
3. 3点セット（物件明細書・現況調査報告書・評価書）の読み方や、民事執行法上の注意点を実務的に解説すること。
4. 記事の末尾には、公式認証宅建業者への「落札サポート・入札代行相談」への自然なCall to Action（CTA）を設けること。
5. Markdownの表（Table）、箇条書き、太字、引用ブロックを効果的に使い、視認性を極限まで高めること。
`;

    // 3. Tiến hành viết bài qua LLM hoặc Heuristic Engine
    let generationSource: 'GEMINI_AI' | 'OPENAI_AI' | 'AUTONOMOUS_SYNTHESIZER' = 'AUTONOMOUS_SYNTHESIZER';
    let title = '';
    let content = '';

    const llmContent = await generateViaLlm(targetTopic, prompt);
    if (llmContent) {
      generationSource = process.env.GEMINI_API_KEY ? 'GEMINI_AI' : 'OPENAI_AI';
      // Tách tiêu đề từ dòng đầu tiên nếu bắt đầu bằng #
      const lines = llmContent.trim().split('\n');
      if (lines[0] && lines[0].startsWith('#')) {
        title = lines[0].replace(/^#+\s*/, '').trim();
        content = lines.slice(1).join('\n').trim();
      } else {
        title = `【2026年最新】${targetTopic.keyword}の完全攻略ガイド｜相場と落札法`;
        content = llmContent;
      }
    } else {
      const synthesized = synthesizeExpertArticle(targetTopic);
      title = synthesized.title;
      content = synthesized.content;
      generationSource = 'AUTONOMOUS_SYNTHESIZER';
    }

    // 4. Quyết định Category & Slug chuẩn SEO quốc tế
    const category: 'GUIDE' | 'CAUTION' | 'MARKET_REPORT' = 
      options?.forceCategory || 
      (targetTopic.category === 'RISK_AND_LEGAL' ? 'CAUTION' : 
       targetTopic.category === 'AREA_DEAL' ? 'GUIDE' : 'GUIDE');

    // Tạo slug tiếng Anh an toàn không trùng lặp
    const baseSlug = targetTopic.id
      ? targetTopic.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'keibai-seo-guide';
    const dateStamp = new Date().toISOString().split('T')[0];
    const uniqueSlug = `${baseSlug}-guide-${dateStamp}`;

    // Chọn ảnh bìa ngữ cảnh
    const featuredImage = COVER_IMAGE_MAP[targetTopic.category] || COVER_IMAGE_MAP['DEFAULT'];

    const tags = Array.from(new Set([
      '不動産競売',
      '公売',
      targetTopic.categoryLabel,
      ...(targetTopic.prefecture ? [targetTopic.prefecture] : []),
      ...targetTopic.keyword.split(/\s+/).filter(w => w.length > 1)
    ])).slice(0, 6);

    // 5. Nếu là Dry-Run (chạy thử nghiệm), không ghi vào DB
    if (options?.dryRun) {
      return {
        success: true,
        action: 'DRY_RUN',
        article: {
          slug: uniqueSlug,
          title,
          category,
          tags,
          featuredImage,
          characterCount: content.length,
          url: `/blogs/${uniqueSlug}`,
          publishedAt: new Date().toISOString()
        },
        seoIntelligence: {
          primaryKeyword: targetTopic.keyword,
          monthlySearchVolume: targetTopic.monthlySearchVolume,
          growthMoM: `+${targetTopic.growthMoM}%`,
          intent: targetTopic.intent,
          targetAudience: targetTopic.targetAudience,
          linkedToolsCount: 5,
          generationSource
        },
        durationMs: Date.now() - startTime
      };
    }

    // 6. Ghi vào cơ sở dữ liệu `prisma.dailyDigest`
    const published = await prisma.dailyDigest.upsert({
      where: { slug: uniqueSlug },
      update: {
        title_ja: title,
        content_ja: content,
        category,
        tags,
        featuredImage,
        publishDate: new Date()
      },
      create: {
        slug: uniqueSlug,
        category,
        publishDate: new Date(),
        tags,
        featuredImage,
        title_ja: title,
        content_ja: content,
        // Điền an toàn các trường đa ngôn ngữ phụ để thỏa mãn schema Prisma
        title_en: title,
        title_vi: title,
        title_zh: title,
        content_en: content,
        content_vi: content,
        content_zh: content
      }
    });

    // 7. Làm mới bộ nhớ đệm ISR của Next.js
    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${uniqueSlug}`);
      revalidatePath('/insights');
      revalidatePath('/sitemap.xml');
    } catch (e) {
      console.warn('Cache revalidation notice:', e);
    }

    return {
      success: true,
      action: 'CREATED',
      article: {
        id: published.id,
        slug: published.slug,
        title: published.title_ja,
        category: published.category,
        tags: published.tags,
        featuredImage: published.featuredImage || featuredImage,
        characterCount: published.content_ja.length,
        url: `/blogs/${published.slug}`,
        publishedAt: published.publishDate.toISOString()
      },
      seoIntelligence: {
        primaryKeyword: targetTopic.keyword,
        monthlySearchVolume: targetTopic.monthlySearchVolume,
        growthMoM: `+${targetTopic.growthMoM}%`,
        intent: targetTopic.intent,
        targetAudience: targetTopic.targetAudience,
        linkedToolsCount: 5,
        generationSource
      },
      durationMs: Date.now() - startTime
    };
  }
}
