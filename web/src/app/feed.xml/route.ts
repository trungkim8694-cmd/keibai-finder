import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logBotHitAsync } from '@/lib/botTracker';

// Đọc header If-Modified-Since nên route luôn dynamic; cache do Cache-Control/CDN đảm nhiệm.
export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatYen(amount: bigint | number | null | undefined): string {
  if (amount == null) return '価格情報なし';
  const val = typeof amount === 'bigint' ? Number(amount) : amount;
  if (val >= 100000000) {
    return `${(val / 100000000).toFixed(1)}億円`;
  }
  if (val >= 10000) {
    return `${Math.round(val / 10000)}万円`;
  }
  return `${val.toLocaleString()}円`;
}

export async function GET(req: NextRequest) {
  const baseUrl = 'https://www.keibai-koubai.com';
  const userAgent = req.headers.get('user-agent');
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  logBotHitAsync({ url: '/feed.xml', userAgent, ip, httpStatus: 200 });

  try {
    // 1. Fetch 50 most recent active auction & public sale properties
    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        address: { not: 'Unknown' },
      },
      select: {
        sale_unit_id: true,
        property_type: true,
        address: true,
        prefecture: true,
        city: true,
        court_name: true,
        starting_price: true,
        created_at: true,
        updated_at: true,
        bid_end_date: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    });

    // Last-Modified = updated_at lớn nhất trong feed, làm tròn xuống giây (HTTP date không có ms)
    const maxMs = properties.reduce((acc, p) => {
      const t = (p.updated_at || p.created_at)?.getTime() ?? 0;
      return t > acc ? t : acc;
    }, 0);
    const latestDate = new Date(Math.floor((maxMs || Date.now()) / 1000) * 1000);

    // 2. HTTP 304 Not Modified check (Googlebot Crawl Budget Optimization)
    const ifModifiedSince = req.headers.get('if-modified-since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (!isNaN(clientDate.getTime()) && latestDate.getTime() <= clientDate.getTime()) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Last-Modified': latestDate.toUTCString(),
            'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      }
    }

    // 3. Build RSS 2.0 XML
    const itemsXml = properties.map((prop) => {
      const priceText = formatYen(prop.starting_price);
      const title = `【${prop.property_type || '不動産競売'}】${prop.prefecture || ''}${prop.city || ''}（売却基準価額: ${priceText}）- ${prop.address}`;
      const url = `${baseUrl}/property/${prop.sale_unit_id}`;
      const pubDate = (prop.created_at || prop.updated_at || new Date()).toUTCString();
      const bidEndStr = prop.bid_end_date ? new Date(prop.bid_end_date).toISOString().split('T')[0] : '随時';

      const description = `裁判所: ${prop.court_name}｜種別: ${prop.property_type}｜売却基準価額: ${priceText}｜所在地: ${prop.address}｜入札期日: ${bidEndStr}`;

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(prop.property_type || '不動産競売')}</category>
    </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Keibai Finder | 全国の不動産競売・公売物件RSSフィード</title>
    <link>${baseUrl}</link>
    <description>裁判所のBIT競売物件および行政機関の公売物件をリアルタイム配信。相場より割安な戸建て・マンション・土地情報。</description>
    <language>ja</language>
    <lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
        'Last-Modified': latestDate.toUTCString(),
      },
    });
  } catch (error) {
    console.error('Error generating /feed.xml:', error);
    return new NextResponse('Internal Server Error generating feed', { status: 500 });
  }
}
