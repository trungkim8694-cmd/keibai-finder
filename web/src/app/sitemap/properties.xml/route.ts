import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 1800; // 30-min ISR cache

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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const [activeProperties, recentArchivedProperties] = await Promise.all([
      prisma.property.findMany({
        where: {
          status: 'ACTIVE',
          address: { not: 'Unknown' },
        },
        select: {
          sale_unit_id: true,
          updated_at: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
        take: 10000,
      }),
      prisma.property.findMany({
        where: {
          status: { in: ['SOLD', 'ARCHIVED'] },
          address: { not: 'Unknown' },
          updated_at: { gte: thirtyDaysAgo },
        },
        select: {
          sale_unit_id: true,
          updated_at: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
        take: 2500,
      }),
    ]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const prop of activeProperties) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/property/${prop.sale_unit_id}`)}</loc>\n`;
      xml += `    <lastmod>${formatIso(prop.updated_at)}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.85</priority>\n';
      xml += '  </url>\n';
    }

    for (const prop of recentArchivedProperties) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/property/${prop.sale_unit_id}`)}</loc>\n`;
      xml += `    <lastmod>${formatIso(prop.updated_at)}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    console.error('sitemap/properties.xml generation error:', err);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
