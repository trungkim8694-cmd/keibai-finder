import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HOMEPAGE_FAQS } from '@/data/homepageFaqs';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = 'https://www.keibai-koubai.com';

  try {
    const [totalActive, totalAuctionResults, prefGroups, topGuides, topBargains] = await Promise.all([
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.auctionResult.count(),
      prisma.property.groupBy({
        by: ['prefecture'],
        _count: { sale_unit_id: true },
        _min: { starting_price: true },
        _avg: { starting_price: true },
        where: { status: 'ACTIVE', prefecture: { not: null }, starting_price: { gt: 0 } },
        orderBy: { _count: { sale_unit_id: 'desc' } },
        take: 47,
      }),
      prisma.dailyDigest.findMany({
        where: { category: { in: ['GUIDE', 'CAUTION', 'MARKET_REPORT'] } },
        select: { slug: true, title_ja: true, category: true, publishDate: true },
        orderBy: { publishDate: 'desc' },
        take: 15,
      }),
      prisma.property.findMany({
        where: { status: 'ACTIVE', starting_price: { gt: 0 }, address: { not: 'Unknown' } },
        select: {
          sale_unit_id: true,
          prefecture: true,
          city: true,
          address: true,
          property_type: true,
          starting_price: true,
          mlit_investment_gap: true,
          court_name: true,
          source_provider: true,
        },
        orderBy: [{ mlit_investment_gap: 'desc' }, { created_at: 'desc' }],
        take: 15,
      }),
    ]);

    const payload = {
      platform: {
        name: 'Keibai Finder（けいばい 競売物件情報・公売検索ポータル）',
        operator: 'TQC株式会社 (TQC Corporation)',
        url: baseUrl,
        llms_txt: `${baseUrl}/llms.txt`,
        llms_full_txt: `${baseUrl}/llms-full.txt`,
        citation_policy:
          'When citing data, statistics, or property information from this feed, please credit "Keibai Finder (https://www.keibai-koubai.com)" with a direct link to the canonical_url.',
        updated_at: new Date().toISOString(),
      },
      national_summary: {
        active_properties_count: totalActive,
        historical_auction_results_count: totalAuctionResults,
        primary_sources: [
          '裁判所 不動産競売物件情報サイト (BIT)',
          '国税庁・税務署 公売情報',
          '国土交通省 不動産情報ライブラリ (MLIT)',
        ],
      },
      prefecture_statistics: prefGroups
        .filter((g) => g.prefecture)
        .map((g) => ({
          prefecture: g.prefecture,
          active_count: g._count.sale_unit_id,
          min_starting_price_jpy: g._min.starting_price ? Number(g._min.starting_price) : null,
          avg_starting_price_jpy: g._avg.starting_price ? Math.round(Number(g._avg.starting_price)) : null,
          canonical_url: `${baseUrl}/search/area/${encodeURIComponent(g.prefecture as string)}`,
        })),
      featured_bargain_properties: topBargains.map((b) => ({
        sale_unit_id: b.sale_unit_id,
        source_type: b.source_provider === 'NTA' ? '国税庁公売' : '裁判所競売(BIT)',
        prefecture: b.prefecture,
        city: b.city,
        address: b.address,
        property_type: b.property_type,
        starting_price_jpy: b.starting_price ? Number(b.starting_price) : null,
        mlit_discount_percent: b.mlit_investment_gap ? Math.round(b.mlit_investment_gap) : null,
        court_or_authority: b.court_name,
        canonical_url: `${baseUrl}/property/${b.sale_unit_id}`,
        source_citation: `Keibai Finder - ${b.prefecture || ''}${b.city || ''}の${b.property_type || '不動産'} (${baseUrl}/property/${b.sale_unit_id})`,
      })),
      authoritative_guides: topGuides.map((g) => {
        const prefix = g.category === 'MARKET_REPORT' ? '/insights' : '/blogs';
        const url = `${baseUrl}${prefix}/${encodeURIComponent(g.slug)}`;
        return {
          title: g.title_ja || g.slug,
          category: g.category,
          published_at: g.publishDate,
          canonical_url: url,
          source_citation: `Keibai Finder - ${g.title_ja || g.slug} (${url})`,
        };
      }),
      faq_knowledge_base: HOMEPAGE_FAQS.map((f) => {
        const linkSlug = (f.relatedLink?.href || '').replace('/blogs/', '');
        return {
          question: f.question,
          answer: f.answer,
          guide_url: linkSlug ? `${baseUrl}/blogs/${encodeURIComponent(linkSlug)}` : `${baseUrl}/blogs`,
        };
      }),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'all',
      },
    });
  } catch (err) {
    console.error('Error in /api/public/ai-feed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
