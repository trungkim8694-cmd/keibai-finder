import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getRailLinesAndStations } from '@/actions/propertyActions';

export const revalidate = 86400; // 24-hour ISR cache for dynamic sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.keibai-koubai.com';

  // 1. Core pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features/keyword-trends`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/map-search`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/trade-price-search`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trade-find`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auction/schedule`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/auction-results`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/area-map`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search/area`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search/station`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/agencies`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/market-insights`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
  ];

  try {
    // 2. Dynamic Property pages
    // Fetch up to 10,000 recent active properties for sitemap to avoid memory bloat
    const activeProperties = await prisma.property.findMany({
      where: { 
        status: 'ACTIVE',
      },
      select: {
        sale_unit_id: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10000,
    });

    const propertyRoutes = activeProperties.map((prop) => ({
      url: `${baseUrl}/property/${prop.sale_unit_id}`,
      lastModified: prop.updated_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // 3. Programmatic SEO Routes (Area)
    // Extract distinct active prefectures and cities to prevent "Submitted URL marked 'noindex'"
    const distinctLocations = await prisma.property.groupBy({
      by: ['prefecture', 'city'],
      where: {
        prefecture: { not: null },
        city: { not: null },
        status: 'ACTIVE',
      },
    });

    const areaRoutes: MetadataRoute.Sitemap = [];
    
    // Extract distinct prefectures
    const prefectures: string[] = Array.from(
      new Set(
        distinctLocations
          .map((loc) => loc.prefecture)
          .filter((p): p is string => typeof p === 'string' && p.length > 0)
      )
    );
    
    prefectures.forEach(pref => {
      areaRoutes.push({
        url: `${baseUrl}/search/area/${encodeURIComponent(pref)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8, // prefectures have higher priority than cities
      });
      // Add area-map specific routes
      areaRoutes.push({
        url: `${baseUrl}/area-map/${encodeURIComponent(pref)}`,
        lastModified: new Date(),
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
        areaRoutes.push({
          url: `${baseUrl}/search/area/${encodeURIComponent(loc.prefecture)}/${encodeURIComponent(loc.city)}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.7,
        });
        // Add area-map specific routes
        areaRoutes.push({
          url: `${baseUrl}/area-map/${encodeURIComponent(loc.prefecture)}/${encodeURIComponent(loc.city)}`,
          lastModified: new Date(),
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
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      });
      
      // Add individual station pages
      lineItem.stations.forEach(station => {
        stationRoutes.push({
          url: `${baseUrl}/search/station/${encodeURIComponent(lineItem.line)}/${encodeURIComponent(station.name)}`,
          lastModified: new Date(),
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
        url: `${baseUrl}${pathPrefix}/${art.slug}`,
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
