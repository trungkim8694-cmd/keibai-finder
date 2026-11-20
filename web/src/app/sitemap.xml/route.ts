import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const latestProp = await prisma.property.findFirst({
      where: { status: 'ACTIVE', address: { not: 'Unknown' } },
      select: { updated_at: true },
      orderBy: { updated_at: 'desc' },
    });

    const lastmod = formatIso(latestProp?.updated_at || stableBuildDate);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap/core.xml`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap/properties.xml`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    console.error('sitemap.xml generation error:', err);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
