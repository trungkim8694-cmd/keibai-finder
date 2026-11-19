import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getRailLinesAndStations } from '@/actions/propertyActions';

export const revalidate = 86400; // 24-hour ISR cache for dynamic sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';
  const stableBuildDate = new Date('2026-11-01T00:00:00Z');

  // Lấy thời điểm cập nhật thực tế từ DB cho <lastmod>.
  // Nếu DB lỗi, fallback về stableBuildDate để sitemap vẫn trả 200 (không bao giờ 500 với Googlebot).
  const [latestProp, latestArticle, latestAgency] = await Promise.all([
    prisma.property.findFirst({
      where: { status: 'ACTIVE' },
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
  ]).catch((error) => {
    console.error('sitemap: failed to load lastmod timestamps, using stableBuildDate:', error);
    return [null, null, null] as const;
  });

  const latestPropDate = latestProp?.updated_at || stableBuildDate;
  const latestArticleDate = latestArticle?.updated_at || stableBuildDate;
  const latestAgencyDate = latestAgency?.updated_at || stableBuildDate;

  // 1. Core pages with authentic Last-Modified timestamps
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/extension`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/features/keyword-trends`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/map-search`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/trade-price-search`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/area-map`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/extension/privacy`,
      lastModified: stableBuildDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/trade-find`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auction/schedule`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/auction-results`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: latestArticleDate,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: latestArticleDate,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/area-map`,
      lastModified: latestPropDate,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search/area`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search/station`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/agencies`,
      lastModified: latestAgencyDate,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/market-insights`,
      lastModified: latestArticleDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/company`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: stableBuildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: stableBuildDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: stableBuildDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: latestPropDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  try {
    // 2. Dynamic Property pages (Active + Recently Transitioned Archive/Sold for Lifecycle SEO)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
          created_at: 'desc',
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

    const propertyRoutes: MetadataRoute.Sitemap = [
      ...activeProperties.map((prop) => ({
        url: `${baseUrl}/property/${prop.sale_unit_id}`,
        lastModified: prop.updated_at || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.85,
      })),
      ...recentArchivedProperties.map((prop) => ({
        url: `${baseUrl}/property/${prop.sale_unit_id}`,
        lastModified: prop.updated_at || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];

    // 3. Programmatic SEO Routes (Area)
    // Extract distinct active prefectures and cities with max updated_at for true lastmod
    const distinctLocations = await prisma.property.groupBy({
      by: ['prefecture', 'city'],
      _max: {
        updated_at: true,
      },
      where: {
        prefecture: { not: null },
        city: { not: null },
        status: 'ACTIVE',
      },
    });

    const areaRoutes: MetadataRoute.Sitemap = [];
    
    // Map max updated_at for prefectures
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

    // Extract distinct prefectures
    const prefectures: string[] = Array.from(prefMaxMap.keys());
    
    prefectures.forEach(pref => {
      const prefDate = prefMaxMap.get(pref) || latestPropDate;
      areaRoutes.push({
        url: `${baseUrl}/search/area/${encodeURIComponent(pref)}`,
        lastModified: prefDate,
        changeFrequency: 'daily' as const,
        priority: 0.8, // prefectures have higher priority than cities
      });
      // Add area-map specific routes
      areaRoutes.push({
        url: `${baseUrl}/area-map/${encodeURIComponent(pref)}`,
        lastModified: prefDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8, 
      });
    });

    // Extract cities
    distinctLocations
      .filter((loc): loc is typeof loc & { prefecture: string; city: string } => 
        typeof loc.prefecture === 'string' && loc.prefecture.length > 0 &&
        typeof loc.city === 'string' && loc.city.length > 0
      )
      .forEach((loc) => {
        const cityDate = loc._max.updated_at || latestPropDate;
        areaRoutes.push({
          url: `${baseUrl}/search/area/${encodeURIComponent(loc.prefecture)}/${encodeURIComponent(loc.city)}`,
          lastModified: cityDate,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        });
        // Add area-map specific routes
        areaRoutes.push({
          url: `${baseUrl}/area-map/${encodeURIComponent(loc.prefecture)}/${encodeURIComponent(loc.city)}`,
          lastModified: cityDate,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      });

    // 4. Station Programmatic Routes
    const railData = await getRailLinesAndStations();
    const stationRoutes: MetadataRoute.Sitemap = [];
    
    railData.forEach(lineItem => {
      // Add the line silo page
      stationRoutes.push({
        url: `${baseUrl}/search/station/${encodeURIComponent(lineItem.line)}`,
        lastModified: latestPropDate,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      });
      
      // Add individual station pages
      lineItem.stations.forEach(station => {
        stationRoutes.push({
          url: `${baseUrl}/search/station/${encodeURIComponent(lineItem.line)}/${encodeURIComponent(station.name)}`,
          lastModified: latestPropDate,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        });
      });
    });

    // 5. Educational Guides & Market Insights (DailyDigest)
    const articles = await prisma.dailyDigest.findMany({
      where: {
        category: { in: ['MARKET_REPORT', 'GUIDE', 'CAUTION'] },
      },
      select: {
        slug: true,
        category: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 1000,
    });

    const articleRoutes: MetadataRoute.Sitemap = articles.map(art => {
      const isMarketReport = art.category === 'MARKET_REPORT';
      const pathPrefix = isMarketReport ? '/insights' : '/blogs';
      return {
        url: `${baseUrl}${pathPrefix}/${encodeURIComponent(art.slug)}`,
        lastModified: art.updated_at || new Date(),
        changeFrequency: 'weekly' as const,
        priority: isMarketReport ? 0.85 : 0.8,
      };
    });

    // 6. Verified Agency Profiles
    const agencies = await prisma.agencyProfile.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        updated_at: true,
      },
      take: 1000,
    });

    const agencyRoutes: MetadataRoute.Sitemap = agencies.map(agency => ({
      url: `${baseUrl}/agencies/${agency.id}`,
      lastModified: agency.updated_at || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }));

    return [...coreRoutes, ...areaRoutes, ...stationRoutes, ...articleRoutes, ...agencyRoutes, ...propertyRoutes];
  } catch (error) {
    console.error('Failed to generate dynamic sitemap database routes, falling back to coreRoutes:', error);
    return coreRoutes;
  }
}
