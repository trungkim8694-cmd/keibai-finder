import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://keibai-koubai.com';

  // 1. Core pages
  const coreRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/trade/find`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  // 2. Dynamic Property pages
  // Fetch up to 10,000 recent active properties for sitemap to avoid memory bloat
  const activeProperties = await prisma.property.findMany({
    where: { 
      // Only include properties not marked as sold/completed if you have a status field. 
      // Assuming all fetched are somewhat relevant for SEO.
    },
    select: {
      sale_unit_id: true,
      updated_at: true,
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 10000 
  });

  const propertyRoutes = activeProperties.map((prop) => ({
    url: `${baseUrl}/property/${prop.sale_unit_id}`,
    lastModified: prop.updated_at || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 3. Programmatic SEO Routes (Area) - We will add this dynamically later when we build the routes
  // But for now, we can extract distinct prefectures and cities that ALREADY exist in our DB
  const distinctLocations = await prisma.property.groupBy({
    by: ['prefecture', 'city'],
    where: {
      prefecture: { not: null },
      city: { not: null }
    }
  });

  const areaRoutes: MetadataRoute.Sitemap = [];
  
  // Extract distinct prefectures
  const prefectures = Array.from(new Set(distinctLocations.map(loc => loc.prefecture).filter(Boolean)));
  
  prefectures.forEach(pref => {
    areaRoutes.push({
      url: `${baseUrl}/search/area/${encodeURIComponent(pref!)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8, // prefectures have higher priority than cities
    });
  });

  // Extract cities
  distinctLocations
    .filter(loc => loc.prefecture && loc.city)
    .forEach((loc) => {
      areaRoutes.push({
        url: `${baseUrl}/search/area/${encodeURIComponent(loc.prefecture!)}/${encodeURIComponent(loc.city!)}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      });
    });

  return [...coreRoutes, ...areaRoutes, ...propertyRoutes];
}
