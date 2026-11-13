import { NextRequest, NextResponse } from 'next/server';
import { 
  getTrendingKeywords, 
  getMacroTrendStats, 
  getNextBestSeoTopic, 
  KEIBAI_TREND_DATABASE,
  TrendCategory, 
  TrendLevel 
} from '@/lib/keibaiTrendEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const category = (searchParams.get('category') as TrendCategory | 'ALL') || 'ALL';
    const trendLevel = (searchParams.get('trendLevel') as TrendLevel | 'ALL') || 'ALL';
    const sortBy = (searchParams.get('sortBy') as 'volume' | 'growth' | 'difficulty') || 'growth';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const [keywords, stats] = await Promise.all([
      getTrendingKeywords({ q, category, trendLevel, sortBy, limit }),
      Promise.resolve(getMacroTrendStats())
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      totalMatches: keywords.length,
      keywords
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });
  } catch (error: any) {
    console.error('Trend API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trending keywords'
    }, { status: 500 });
  }
}

// POST: Tích hợp với AI Agent (Agent Outline Generator & Topic Recommendation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, keywordId, customPrompt } = body;

    if (action === 'get_next_topic') {
      const topTopic = await getNextBestSeoTopic();
      return NextResponse.json({
        success: true,
        recommendedTopic: topTopic,
        agentExecutionInstructions: {
          task: 'AI_SEO_BLOG_WRITING',
          targetAudience: topTopic.targetAudience,
          suggestedPrompt: topTopic.agentPrompt,
          keyQuestionsToAnswer: topTopic.keyQuestions,
          targetKeywords: [topTopic.keyword, `${topTopic.keyword} 2026`, `${topTopic.keyword} メリット リスク`]
        }
      });
    }

    if (action === 'generate_outline') {
      const target = KEIBAI_TREND_DATABASE.find(k => k.id === keywordId || k.keyword === keywordId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Keyword not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        keyword: target.keyword,
        category: target.categoryLabel,
        searchVolume: target.monthlySearchVolume,
        growthMoM: `+${target.growthMoM}%`,
        outlineProposal: {
          title: `【2026年最新】${target.keyword}の徹底解説｜失敗しない攻略ポイントと相場`,
          metaDescription: `${target.keyword}を完全網羅。${target.keyQuestions[0]}から実勢相場との価格乖離まで、公的データに基づきプロが分かりやすく解説。`,
          h2Sections: [
            {
              heading: `1. なぜ今「${target.keyword}」の検索需要が急増しているのか？`,
              points: ['市場背景（円安・物価高・割安実需需要）', '一般不動産市場との価格差メリット']
            },
            {
              heading: `2. 投資家・購入者が押さえるべき重要ポイント`,
              points: target.keyQuestions
            },
            {
              heading: `3. 3点セットと公的取引データから読み解くリスク判定`,
              points: ['物件明細書・現況調査報告書のチェック項目', '見落としがちな追加費用（残置物・リフォーム・滞納金）']
            },
            {
              heading: `4. まとめ：賢く落札するための具体的アクションプラン`,
              points: ['Keibai Finderでの物件検索', '専門会社への代行相談']
            }
          ]
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Agent Trend Integration Error:', error);
    return NextResponse.json({ success: false, error: 'Internal agent error' }, { status: 500 });
  }
}
