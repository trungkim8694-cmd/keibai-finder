import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRailLinesAndStations } from '@/actions/propertyActions';

export const revalidate = 3600; // 1-hour ISR cache

function formatIso(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com').replace(/\/$/, '');
  const stableBuildDate = new Date('2026-11-01T00:00:00Z');

  try {
    const [latestProp, latestArticle, latestAgency] = await Promise.all([
      prisma.property.findFirst({
        where: { status: 'ACTIVE', address: { not: 'Unknown' } },
        select: { updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.dailyDigest.findFirst({
        select: { updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.agencyProfile.findFirst({
        where: { isVerified: true },
        select: { updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
    ]);

    const latestPropDate = latestProp?.updated_at || stableBuildDate;
    const latestArticleDate = latestArticle?.updated_at || stableBuildDate;
    const latestAgencyDate = latestAgency?.updated_at || stableBuildDate;

    // 1. Core High-Value Static Hubs
    const staticHubs = [
      { path: '/', lastmod: latestPropDate, changefreq: 'daily', priority: '1.0' },
      { path: '/map', lastmod: latestPropDate, changefreq: 'daily', priority: '0.95' },
      { path: '/trade-find', lastmod: latestPropDate, changefreq: 'daily', priority: '0.9' },
      { path: '/auction/schedule', lastmod: latestPropDate, changefreq: 'daily', priority: '0.95' },
      { path: '/auction-results', lastmod: latestPropDate, changefreq: 'daily', priority: '0.9' },
      { path: '/blogs', lastmod: latestArticleDate, changefreq: 'daily', priority: '0.85' },
      { path: '/insights', lastmod: latestArticleDate, changefreq: 'daily', priority: '0.85' },
      { path: '/area-map', lastmod: latestPropDate, changefreq: 'weekly', priority: '0.85' },
      { path: '/search/area', lastmod: latestPropDate, changefreq: 'daily', priority: '0.85' },
      { path: '/search/station', lastmod: latestPropDate, changefreq: 'daily', priority: '0.85' },
      { path: '/agencies', lastmod: latestAgencyDate, changefreq: 'weekly', priority: '0.85' },
      { path: '/market-insights', lastmod: latestArticleDate, changefreq: 'weekly', priority: '0.8' },
      { path: '/features', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.8' },
      { path: '/features/keyword-trends', lastmod: latestPropDate, changefreq: 'daily', priority: '0.85' },
      { path: '/features/map-search', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.85' },
      { path: '/features/trade-price-search', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.85' },
      { path: '/features/area-map', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.85' },
      { path: '/extension', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.8' },
      { path: '/company', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.7' },
      { path: '/contact', lastmod: stableBuildDate, changefreq: 'monthly', priority: '0.7' },
      { path: '/terms', lastmod: stableBuildDate, changefreq: 'yearly', priority: '0.5' },
      { path: '/privacy', lastmod: stableBuildDate, changefreq: 'yearly', priority: '0.5' },
      { path: '/llms.txt', lastmod: latestPropDate, changefreq: 'daily', priority: '0.8' },
      { path: '/llms-full.txt', lastmod: latestPropDate, changefreq: 'daily', priority: '0.8' },
    ];

    // 2. Area Hubs (Prefecture & Active City)
    const distinctLocations = await prisma.property.groupBy({
      by: ['prefecture', 'city'],
      _max: { updated_at: true },
      where: {
        prefecture: { not: null },
        city: { not: null },
        status: 'ACTIVE',
        address: { not: 'Unknown' },
        OR: [
          { bid_end_date: { gte: new Date() } },
          { bid_end_date: null }
        ],
      },
    });

    const prefMaxMap = new Map<string, Date>();
    distinctLocations.forEach((loc) => {
      if (loc.prefecture) {
        const curMax = prefMaxMap.get(loc.prefecture);
        const locDate = loc._max.updated_at || latestPropDate;
        if (!curMax || locDate > curMax) {
          prefMaxMap.set(loc.prefecture, locDate);
        }
      }
    });

    const areaUrls: Array<{ url: string; lastmod: Date; changefreq: string; priority: string }> = [];

    // Distinct Prefectures
    for (const [pref, maxDate] of prefMaxMap.entries()) {
      areaUrls.push({
        url: `${baseUrl}/search/area/${encodeURIComponent(pref)}`,
        lastmod: maxDate,
        changefreq: 'daily',
        priority: '0.85',
      });
    }

    // Distinct Cities with Active Listings
    for (const loc of distinctLocations) {
      if (loc.prefecture && loc.city) {
        areaUrls.push({
          url: `${baseUrl}/search/area/${encodeURIComponent(loc.prefecture)}/${encodeURIComponent(loc.city)}`,
          lastmod: loc._max.updated_at || latestPropDate,
          changefreq: 'daily',
          priority: '0.75',
        });
      }
    }

    // 3. Station Hubs (Active Rail Lines & Stations)
    const railData = await getRailLinesAndStations();
    const stationUrls: Array<{ url: string; lastmod: Date; changefreq: string; priority: string }> = [];

    for (const lineItem of railData) {
      stationUrls.push({
        url: `${baseUrl}/search/station/${encodeURIComponent(lineItem.line)}`,
        lastmod: latestPropDate,
        changefreq: 'daily',
        priority: '0.8',
      });

      for (const station of lineItem.stations) {
        stationUrls.push({
          url: `${baseUrl}/search/station/${encodeURIComponent(lineItem.line)}/${encodeURIComponent(station.name)}`,
          lastmod: latestPropDate,
          changefreq: 'daily',
          priority: '0.7',
        });
      }
    }

    // 4. Articles & Guides (DailyDigest)
    const articles = await prisma.dailyDigest.findMany({
      where: { category: { in: ['MARKET_REPORT', 'GUIDE', 'CAUTION'] } },
      select: { slug: true, category: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
      take: 1000,
    });

    const articleUrls = articles.map((art) => {
      const isMarketReport = art.category === 'MARKET_REPORT';
      const pathPrefix = isMarketReport ? '/insights' : '/blogs';
      return {
        url: `${baseUrl}${pathPrefix}/${encodeURIComponent(art.slug)}`,
        lastmod: art.updated_at || latestArticleDate,
        changefreq: 'weekly',
        priority: isMarketReport ? '0.85' : '0.8',
      };
    });

    // 5. Verified Agencies
    const agencies = await prisma.agencyProfile.findMany({
      where: { isVerified: true },
      select: { id: true, updated_at: true },
      take: 500,
    });

    const agencyUrls = agencies.map((agency) => ({
      url: `${baseUrl}/agencies/${agency.id}`,
      lastmod: agency.updated_at || latestAgencyDate,
      changefreq: 'monthly',
      priority: '0.75',
    }));

    // XML Construction
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const h of staticHubs) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}${h.path}`)}</loc>\n`;
      xml += `    <lastmod>${formatIso(h.lastmod)}</lastmod>\n`;
      xml += `    <changefreq>${h.changefreq}</changefreq>\n`;
      xml += `    <priority>${h.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    for (const a of areaUrls) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(a.url)}</loc>\n`;
      xml += `    <lastmod>${formatIso(a.lastmod)}</lastmod>\n`;
      xml += `    <changefreq>${a.changefreq}</changefreq>\n`;
      xml += `    <priority>${a.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    for (const s of stationUrls) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(s.url)}</loc>\n`;
      xml += `    <lastmod>${formatIso(s.lastmod)}</lastmod>\n`;
      xml += `    <changefreq>${s.changefreq}</changefreq>\n`;
      xml += `    <priority>${s.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    for (const art of articleUrls) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(art.url)}</loc>\n`;
      xml += `    <lastmod>${formatIso(art.lastmod)}</lastmod>\n`;
      xml += `    <changefreq>${art.changefreq}</changefreq>\n`;
      xml += `    <priority>${art.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    for (const ag of agencyUrls) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(ag.url)}</loc>\n`;
      xml += `    <lastmod>${formatIso(ag.lastmod)}</lastmod>\n`;
      xml += `    <changefreq>${ag.changefreq}</changefreq>\n`;
      xml += `    <priority>${ag.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Robots-Tag': 'noindex', // Sitemaps themselves don't need indexing
      },
    });
  } catch (err) {
    console.error('sitemap/core.xml generation error:', err);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
