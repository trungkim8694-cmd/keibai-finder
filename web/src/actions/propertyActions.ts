'use server';

import { prisma } from '@/lib/prisma';
import { calculateRoi, convertToWesternYear, extractAuctionSchedule, extractAuctionRoundFromData, extractTotalArea } from '@/lib/utils';
import { resolveCityCode } from '@/lib/mlitApi';
import { formatBidPeriod } from '@/utils/dateFormatter';
import { revalidatePath, unstable_cache } from 'next/cache';
import { headers } from 'next/headers';

// Simple in-memory rate limiting map for debouncing
// Key: "IP_PropertyID", Value: timestamp
const viewDebounceCache = new Map<string, number>();

export async function incrementViewCount(propertyId: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    // Cleanup cache periodically to avoid memory leak if node runs long
    if (viewDebounceCache.size > 10000) {
      viewDebounceCache.clear();
    }

    const cacheKey = `${ip}_${propertyId}`;
    const now = Date.now();
    const lastViewed = viewDebounceCache.get(cacheKey);

    // 15 minutes limit (15 * 60 * 1000 = 900000ms)
    if (lastViewed && (now - lastViewed < 900000)) {
      return; 
    }

    // Update cache
    viewDebounceCache.set(cacheKey, now);

    await prisma.$executeRaw`
      UPDATE "Property" 
      SET "views" = COALESCE("views", 0) + 1 
      WHERE "sale_unit_id" = ${propertyId}
    `;
    
    // Revalidating ensures cached variants update 
    revalidatePath(`/property/${propertyId}`);
  } catch (error) {
    console.error("Failed to increment views:", error);
  }
}

export async function getAreaStats() {
  return unstable_cache(async () => {
    try {
      const stats = await prisma.property.groupBy({
        by: ['prefecture'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      });
      
      const total = await prisma.property.count({ where: { status: 'ACTIVE' }});
      
      const result: Record<string, number> = { '全国': total };
      stats.forEach(item => {
        if (item.prefecture) {
          result[item.prefecture] = item._count._all;
        }
      });
      
      return result;
    } catch (err) {
      console.error("Fetch area stats err", err);
      return {};
    }
  }, ['area_stats_cache_v1'], { revalidate: 3600, tags: ['stats'] })();
}

export async function getCityStats(prefecture: string) {
  try {
    const stats = await prisma.property.groupBy({
      by: ['city'],
      where: { 
        status: 'ACTIVE',
        prefecture: prefecture,
        city: { not: null }
      },
      _count: { _all: true },
      orderBy: { _count: { city: 'desc'} }
    });
    
    return stats.map(item => ({
      city: item.city as string,
      count: item._count._all
    }));
  } catch (err) {
    console.error("Fetch city stats err", err);
    return [];
  }
}

export async function getTypeStats() {
    try {
      const stats = await prisma.property.groupBy({
        by: ['property_type'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      });
      
      const result: Record<string, number> = {
        '戸建て': 0,
        'マンション': 0,
        '土地': 0,
        '農地': 0,
        'その他': 0
      };
      
      const mainTypes = ['戸建て', 'マンション', '土地', '農地'];
      
      stats.forEach(item => {
        const type = item.property_type;
        const count = item._count._all;
        if (type && mainTypes.includes(type)) {
          result[type] += count;
        } else {
          result['その他'] += count;
        }
      });

      return result;
    } catch (err) {
      console.error("Fetch type stats err", err);
      return {};
    }
}


export async function getTotalPropertiesCount() {
  try {
    return await prisma.property.count({
      where: { status: 'ACTIVE' }
    });
  } catch(e) {
    console.error("Total properties count error", e);
    return 0;
  }
}


export interface SearchSuggestion {
  type: 'STATION' | 'LINE' | 'CITY' | 'ADDRESS';
  text: string;
  subtext?: string;
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    if (!query || query.trim().length < 2) return [];
    
    const qStr = `%${query.trim()}%`;
    const results: SearchSuggestion[] = [];

    // 1. Stations
    const stations = await prisma.$queryRaw`
      SELECT DISTINCT "nearest_station" as text
      FROM "Property"
      WHERE "nearest_station" ILIKE ${qStr} AND "status" = 'ACTIVE' AND "nearest_station" IS NOT NULL
      LIMIT 3
    `;

    // 2. Lines
    const lines = await prisma.$queryRaw`
      SELECT DISTINCT "line_name" as text
      FROM "Property"
      WHERE "line_name" ILIKE ${qStr} AND "status" = 'ACTIVE' AND "line_name" IS NOT NULL
      LIMIT 2
    `;

    // 3. Prefecture / City
    const cities = await prisma.$queryRaw`
      SELECT DISTINCT "prefecture", "city"
      FROM "Property"
      WHERE ("prefecture" ILIKE ${qStr} OR "city" ILIKE ${qStr}) AND "status" = 'ACTIVE'
      LIMIT 3
    `;
    
    // 4. Address
    const addresses = await prisma.$queryRaw`
      SELECT "address"
      FROM "Property"
      WHERE "address" ILIKE ${qStr} AND "status" = 'ACTIVE'
      LIMIT 2
    `;

    (stations as any[]).forEach(s => s.text && results.push({ type: 'STATION', text: s.text }));
    (lines as any[]).forEach(l => l.text && results.push({ type: 'LINE', text: l.text }));
    
    (cities as any[]).forEach(loc => {
      const qLower = query.toLowerCase();
      if (loc.city && loc.city.toLowerCase().includes(qLower)) {
         if (!results.find(r => r.text === loc.city)) {
           results.push({ type: 'CITY', text: loc.city, subtext: loc.prefecture });
         }
      } else if (loc.prefecture && loc.prefecture.toLowerCase().includes(qLower)) {
         if (!results.find(r => r.text === loc.prefecture)) {
            results.push({ type: 'CITY', text: loc.prefecture });
         }
      }
    });

    (addresses as any[]).forEach(a => a.address && results.push({ type: 'ADDRESS', text: a.address }));

    return results;
  } catch (error) {
    console.error("Failed to fetch search suggestions", error);
    return [];
  }
}

export interface BoundingBox {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

export interface SearchFilters {
  bounds?: BoundingBox;
  lat?: number;
  lng?: number;

  minPrice?: number;
  maxPrice?: number;
  types?: string[];
  newOnly?: boolean;
  prefecture?: string;
  prefectures?: string[];
  page?: number;
  limit?: number;
  isMapPayload?: boolean;
  provider?: string;
  providers?: string[];
  lineName?: string;
  stationName?: string;
  maxWalkTime?: number; // Thay cho walkTimeMins
  managingAuthority?: string;
  courtName?: string;
  sortBy?: 'newest' | 'priceAsc' | 'areaDesc' | 'viewsDesc' | 'bid_start_asc' | 'bid_start_desc';
  sort?: string;
  keyword?: string;
  isClosingSoon?: boolean;
  minArea?: number;
}

function buildWhereClause(filters: SearchFilters, exclude?: 'types' | 'prefectures' | 'provider' | 'railways') {
  const andConditions: any[] = [{ status: 'ACTIVE' }];

  if (filters.bounds && filters.bounds.sw && filters.bounds.ne && exclude !== 'prefectures') {
    andConditions.push({
      lat: { gte: filters.bounds.sw.lat, lte: filters.bounds.ne.lat },
      lng: { gte: filters.bounds.sw.lng, lte: filters.bounds.ne.lng }
    });
  }

  if (exclude !== 'types' && filters.types && filters.types.length > 0) {
    if (filters.types.includes('その他')) {
      const explicitTypes = filters.types.filter(t => t !== 'その他');
      if (explicitTypes.length > 0) {
        andConditions.push({
          OR: [
            { property_type: { in: explicitTypes } },
            { property_type: { notIn: ['戸建て', 'マンション', '土地', '農地'] } }
          ]
        });
      } else {
        andConditions.push({
          property_type: { notIn: ['戸建て', 'マンション', '土地', '農地'] }
        });
      }
    } else {
      andConditions.push({ property_type: { in: filters.types } });
    }
  }

  if (exclude !== 'prefectures') {
    if (filters.prefectures && filters.prefectures.length > 0) {
      andConditions.push({ prefecture: { in: filters.prefectures } });
    } else if (filters.prefecture) {
      andConditions.push({ prefecture: filters.prefecture });
    }
  }

  if (exclude !== 'provider') {
    const activeProviders = filters.providers || (filters.provider && filters.provider !== 'ALL' ? [filters.provider] : ['BIT', 'NTA']);
    const providerOrConditions: any[] = [];
    
    if (activeProviders.includes('BIT')) {
      const bitCondition: any = { source_provider: 'BIT' };
      if (filters.courtName && filters.courtName !== 'ALL') {
         bitCondition.court_name = filters.courtName;
      }
      providerOrConditions.push(bitCondition);
    }

    if (activeProviders.includes('NTA')) {
      const ntaCondition: any = { source_provider: 'NTA' };
      if (filters.managingAuthority && filters.managingAuthority !== 'ALL') {
         ntaCondition.managing_authority = { contains: filters.managingAuthority.split(' ')[0] };
      }
      providerOrConditions.push(ntaCondition);
    }

    if (providerOrConditions.length > 0) {
      andConditions.push({ OR: providerOrConditions });
    }
  }

  if (exclude !== 'railways') {
    if (filters.lineName && filters.lineName !== 'ALL') {
      andConditions.push({
         OR: [
            { line_name: { contains: filters.lineName, mode: 'insensitive' } },
            { nearest_station: { contains: filters.lineName, mode: 'insensitive' } }
         ]
      });
    }
    
    if (filters.stationName && filters.stationName !== 'ALL') {
      andConditions.push({ nearest_station: { contains: filters.stationName, mode: 'insensitive' } });
    }
  }

  if (filters.minPrice || filters.maxPrice) {
    const priceFilter: any = {};
    if (filters.minPrice) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice) priceFilter.lte = filters.maxPrice;
    andConditions.push({ starting_price: priceFilter });
  }
  
  if (filters.newOnly) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    andConditions.push({ created_at: { gte: weekAgo } });
  }
  
  if (filters.isClosingSoon) {
    const now = new Date();
    const p7D = new Date();
    p7D.setDate(p7D.getDate() + 7);
    andConditions.push({ bid_end_date: { gte: now, lte: p7D } });
  }
  
  if (filters.minArea) {
    andConditions.push({ area: { gte: filters.minArea } });
  }

  if (filters.keyword) {
    andConditions.push({
      OR: [
        { address: { contains: filters.keyword, mode: 'insensitive' } },
        { nearest_station: { contains: filters.keyword, mode: 'insensitive' } },
        { prefecture: { contains: filters.keyword, mode: 'insensitive' } },
        { city: { contains: filters.keyword, mode: 'insensitive' } },
      ]
    });
  }
  
  return { AND: andConditions };
}

export async function getFacetedStats(filters: SearchFilters = {}) {
  try {
    const typesWhere = buildWhereClause(filters, 'types');
    const typesPromise = prisma.property.groupBy({
      by: ['property_type'],
      where: typesWhere,
      _count: { _all: true }
    }).then(stats => {
      const result: Record<string, number> = { '戸建て': 0, 'マンション': 0, '土地': 0, '農地': 0, 'その他': 0 };
      const mainTypes = ['戸建て', 'マンション', '土地', '農地'];
      stats.forEach(item => {
        const type = item.property_type;
        const count = item._count._all;
        if (type && mainTypes.includes(type)) result[type] += count;
        else result['その他'] += count;
      });
      return result;
    });

    const prefWhere = buildWhereClause(filters, 'prefectures');
    const prefPromise = prisma.property.groupBy({
      by: ['prefecture'],
      where: prefWhere,
      _count: { _all: true },
    }).then(res => res.reduce((acc, curr) => {
      if (curr.prefecture) acc[curr.prefecture] = curr._count._all;
      return acc;
    }, {} as Record<string, number>));

    const authWhere = buildWhereClause(filters, 'provider');
    const authPromise = (async () => {
       const bitStats = await prisma.property.groupBy({
           by: ['court_name'],
           where: { ...authWhere, source_provider: 'BIT' },
           _count: { _all: true },
       });
       const ntaStats = await prisma.property.groupBy({
           by: ['managing_authority'],
           where: { ...authWhere, source_provider: 'NTA' },
           _count: { _all: true },
       });
       
       const processStats = (data: any[], keyField: string) => {
         return data.filter(d => d[keyField]).map(d => ({
           name: d[keyField], count: d._count._all
         })).sort((a, b) => b.count - a.count);
       };

       return {
         bit: processStats(bitStats, 'court_name'),
         nta: processStats(ntaStats, 'managing_authority').map(n => ({ 
             name: n.name.split(' ')[0], count: n.count 
         }))
       };
    })();

    const railWhere = buildWhereClause(filters, 'railways');
    const railPromise = prisma.property.findMany({
      where: { ...railWhere, line_name: { not: null, not: '' } },
      select: { line_name: true, nearest_station: true },
    }).then(rawData => {
      const lineMap: Record<string, Set<string>> = {};
      const lineCounts: Record<string, number> = {};

      rawData.forEach(p => {
        if (!p.line_name) return;
        
        let lines = p.line_name.includes(',') ? p.line_name.split(',').map(s => s.trim()) : [p.line_name.trim()];
        let stations = (p.nearest_station && p.nearest_station.includes(','))
          ? p.nearest_station.split(',').map(s => s.trim())
          : [p.nearest_station?.trim() || ''];

        lines.forEach(line => {
          if (!lineMap[line]) {
            lineMap[line] = new Set();
            lineCounts[line] = 0;
          }
          lineCounts[line]++;
          stations.forEach(st => {
            if (st) lineMap[line].add(st);
          });
        });
      });

      return Object.entries(lineMap).map(([line, stationSet]) => ({
        line,
        count: lineCounts[line],
        stations: Array.from(stationSet).sort()
      })).sort((a, b) => b.count - a.count);
    });

    const [typeStats, areaStats, authorityStats, railData] = await Promise.all([
       typesPromise, prefPromise, authPromise, railPromise
    ]);

    return { typeStats, areaStats, authorityStats, railData };
  } catch (err) {
     console.error("Faceted calculation error:", err);
     return { typeStats: {}, areaStats: {}, authorityStats: { bit: [], nta: [] }, railData: [] };
  }
}

async function getPropertiesCore(filters: SearchFilters) {
  console.log(">>> [DEBUG getProperties DB HIT]", JSON.stringify(filters));
  try {
    let data: any[] = [];
    
    const whereClause = buildWhereClause(filters);
    console.log(">>> [DEBUG getProperties FINAL WHERE]", JSON.stringify(whereClause, null, 2));


        let effectiveSort = filters.sort === 'views' ? 'viewsDesc' : (filters.sort || filters.sortBy);
        
        let defaultOrderBy: any = { created_at: 'desc' };
        if (effectiveSort) {
           if (effectiveSort === 'newest') defaultOrderBy = { created_at: 'desc' };
           else if (effectiveSort === 'priceAsc') defaultOrderBy = { starting_price: 'asc' };
           else if (effectiveSort === 'areaDesc') defaultOrderBy = { area: { sort: 'desc', nulls: 'last' } };
           else if (effectiveSort === 'viewsDesc') defaultOrderBy = { views: 'desc' };
           else if (effectiveSort === 'bid_start_asc') defaultOrderBy = { bid_start_date: 'asc' };
           else if (effectiveSort === 'bid_start_desc') defaultOrderBy = { bid_start_date: 'desc' };
           else if (effectiveSort === 'ending') defaultOrderBy = { bid_end_date: 'asc' };
           else if (effectiveSort === 'gap_desc') defaultOrderBy = { mlit_investment_gap: 'desc' };
        }

        if (filters.isMapPayload) {
            data = await prisma.property.findMany({
              where: whereClause,
              select: {
                sale_unit_id: true,
                source_provider: true,
                source_url: true,
                lat: true,
                lng: true,
                property_type: true,
                starting_price: true,
                raw_display_data: true,
                status: true,
                court_name: true,
                address: true,
                views: true,
                thumbnailUrl: true,
                images: true,
                prefecture: true,
                city: true,
                area: true,
                bid_start_date: true,
                bid_end_date: true,
                line_name: true,
                nearest_station: true,
                walk_time_to_station: true,
                managing_authority: true,
                ai_analysis: true,
                ai_status: true,
                mlit_investment_gap: true,
                mlit_estimated_price: true,
              },
              take: 2000,
              orderBy: defaultOrderBy
            });
            
            // Generate deterministic offset jitter for EXACT SAME coordinates
            const coordinateMap = new Map();
            return data.map((d: any) => {
               if (d.lat && d.lng) {
                  const key = `${d.lat.toFixed(5)}-${d.lng.toFixed(5)}`;
                  const count = coordinateMap.get(key) || 0;
                  if (count > 0) {
                     // Add an offset of ~1.1 meters per count in a spiraling manner
                     d.lat += (Math.random() - 0.5) * 0.00002;
                     d.lng += (Math.random() - 0.5) * 0.00002;
                  }
                  coordinateMap.set(key, count + 1);
               }
               
               // Next.js Serialization Fix: Convert BigInt to Number
               if (typeof d.starting_price === 'bigint') {
                   d.starting_price = Number(d.starting_price);
               }
               if (typeof d.mlit_estimated_price === 'bigint') {
                   d.mlit_estimated_price = Number(d.mlit_estimated_price);
               }
               
               return d;
            });
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        
        data = await prisma.property.findMany({
          where: whereClause,
          orderBy: defaultOrderBy,
          skip: (page - 1) * limit,
          take: limit
        });

    return await mapPropertiesWithStations(data);
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return [];
  }
}

const getPropertiesCached = unstable_cache(
  async (filters: SearchFilters) => {
    return getPropertiesCore(filters);
  },
  ['daily-properties-cache'],
  { tags: ['daily-properties'], revalidate: 86400 }
);

export async function getProperties(filters: SearchFilters = {}) {
  // Map payloads contain up to 2000 properties with rich JSON fields, exceeding Next.js 2MB unstable_cache limit.
  // We bypass unstable_cache here; the CDN Edge cache (route.ts Cache-Control) will handle caching it instead.
  if (filters.isMapPayload) {
    return getPropertiesCore(filters);
  }
  return getPropertiesCached(filters);
}

export async function getPropertiesByIds(ids: string[]) {
  try {
    const data = await prisma.property.findMany({
      where: { sale_unit_id: { in: ids } }
    });
    return await mapPropertiesWithStations(data);
  } catch (err) {
    console.error("Fetch favs error", err);
    return [];
  }
}

export async function getNearestStationInfo(lat: number, lng: number, sale_unit_id?: string): Promise<string | null> {
  if (!lat || !lng) return null;
  try {
    const stations = await prisma.$queryRawUnsafe(`
      SELECT 
        "name_ja", "line_name",
        ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( "lat" ) ) ) ) AS distance
      FROM "RailwayStation"
      WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
      ORDER BY distance ASC
      LIMIT 1
    `);
    const stData = stations as any[];
    if (stData && stData.length > 0) {
      const row = stData[0];
      const distKm = Number(row.distance);
      const walkMin = Math.ceil((distKm * 1000 * 1.25) / 80);
      const nameStr = row.line_name && row.line_name !== 'Unknown Railway' ? `${row.line_name} / ${row.name_ja}` : row.name_ja;
      const formattedStation = `${nameStr} 徒歩${walkMin}分 (${distKm.toFixed(1)} km)`;
      
      if (sale_unit_id) {
         try {
            await prisma.property.update({
               where: { sale_unit_id },
               data: {
                  nearest_station: formattedStation,
                  line_name: row.line_name && row.line_name !== 'Unknown Railway' ? row.line_name : null,
                  distance_to_station: Math.round(distKm * 1000),
                  walk_time_to_station: walkMin
               }
            });
         } catch (updateErr) {
            console.error("Failed to update property with station info", updateErr);
         }
      }
      
      return formattedStation;
    }
  } catch (e) {
    console.error("Failed to get nearest station", e);
  }
  return null;
}

// Helper to batch evaluate stations and map data
async function mapPropertiesWithStations(data: any[]) {
    // MAP TO SHARED FORMAT
    const formattedData = await Promise.all(data.map(async p => {
      const startPrice = p.starting_price !== null ? Number(p.starting_price) : 0;
      
      let westernYear = p.build_year_western;
      if (!westernYear) {
         // lightweight parse or fallback
         if (p.raw_display_data) {
           const rawStr = JSON.stringify(p.raw_display_data);
           const m = rawStr.match(/"[^"]*年月[^"]*"\s*:\s*"([^"]+)"/);
           if (m) {
             westernYear = convertToWesternYear(m[1]);
           }
         }
         if (!westernYear) westernYear = 1990;
      }
      
      const roiPercent = calculateRoi(startPrice, p.prefecture, westernYear, p.property_type);
      
      const displayArea = p.area 
        ? `${p.area.toLocaleString('en-US')}m²` 
        : null;
        
      let displayStation = null;
      if (p.nearest_station) {
         displayStation = p.walk_time_to_station 
           ? `${p.nearest_station} 徒歩${p.walk_time_to_station}分` 
           : p.nearest_station;
      }
      
      // Fallback
      let auctionSchedule = formatBidPeriod(p.bid_start_date, p.bid_end_date);
      if (!auctionSchedule) {
         auctionSchedule = extractAuctionSchedule(p.raw_display_data);
      }
      
      const auctionRound = extractAuctionRoundFromData(p.raw_display_data);

        const rawImages = p.images || [];
        const mappedImages = rawImages.map((img: string) => 
            img.startsWith('./') ? `https://www.koubai.nta.go.jp/auctionx/public${img.substring(1)}` : img
        );

        const mappedThumbnail = p.source_provider === 'NTA' && mappedImages.length > 0
          ? mappedImages[0]
          : p.thumbnailUrl ? p.thumbnailUrl.replace('bit.sikkou.jp', 'www.bit.courts.go.jp') : null;

        return {
          sale_unit_id: p.sale_unit_id,
          court_name: p.court_name,
          property_type: p.property_type,
          address: p.address,
          prefecture: p.prefecture,
          city: p.city,
          starting_price: startPrice,
          status: p.status,
          lat: Number(p.lat),
          lng: Number(p.lng),
          roiPercent: roiPercent,
          nearest_station: p.nearest_station,
          line_name: p.line_name,
          walk_time_to_station: p.walk_time_to_station,
          area: p.area != null ? Math.round(Number(p.area)) : (() => {
            const ea = extractTotalArea(p.raw_display_data);
            return ea ? Math.round(ea) : null;
          })(),
          bid_end_date: p.bid_end_date,
          bid_start_date: p.bid_start_date,
          views: p.views || 0,
          auctionSchedule: auctionSchedule,
          auctionRound: auctionRound,
          thumbnailUrl: mappedThumbnail,
          images: mappedImages,
          source_provider: p.source_provider || 'BIT',
          source_url: p.source_url || null,
          managing_authority: p.managing_authority || null,
          contact_url: (() => {
            if (!p.raw_display_data) return null;
            if (p.source_provider === 'NTA') {
               const raw = p.raw_display_data as any;
               return raw.nta_map_link || null;
            }
            const raw = p.raw_display_data;
            const arr = Array.isArray(raw) ? raw : null;
            if (!arr) return null;
            const summary = arr.find((s: any) => s?.asset_title === 'Summary');
            return summary?.contact_url || null;
          })(),
          mlit_investment_gap: p.mlit_investment_gap !== null && p.mlit_investment_gap !== undefined ? Number(p.mlit_investment_gap) : null,
          mlit_estimated_price: p.mlit_estimated_price !== null && p.mlit_estimated_price !== undefined ? Number(p.mlit_estimated_price) : null
      };
    }));

    return formattedData;
}

export async function getRailLinesAndStations() {
    try {
      const data = await prisma.property.groupBy({
        by: ['line_name', 'nearest_station', 'prefecture'],
        where: {
          status: 'ACTIVE',
          line_name: { not: null },
          nearest_station: { not: null }
        },
        _count: {
          _all: true
        }
      });

      // Group stations by line
      const aggregated: Record<string, { count: number, prefectures: Set<string>, stations: { name: string, count: number }[] }> = {};
      
      for (const item of data) {
        const line = (item as any).line_name;
        const rawStation = (item as any).nearest_station;
        const count = item._count._all;
        const prefecture = (item as any).prefecture;
        
        if (line && rawStation) {
          // 1. Parse Pure Station Name from "LineName / StationName 徒歩X分 (Y km)"
          const withoutWalk = rawStation.split(' 徒歩')[0]; // Removes " 徒歩X分 (Y km)"
          const parts = withoutWalk.split(' / '); // Splits "LineName / StationName"
          const pureStation = parts[parts.length - 1].trim(); // Takes "StationName"

          if (!aggregated[line]) {
            aggregated[line] = { count: 0, prefectures: new Set<string>(), stations: [] };
          }
          aggregated[line].count += count;
          
          if (prefecture) {
             aggregated[line].prefectures.add(prefecture);
          }
          
          if (pureStation) {
            const existingStation = aggregated[line].stations.find(s => s.name === pureStation);
            if (existingStation) {
              existingStation.count += count;
            } else {
              aggregated[line].stations.push({ name: pureStation, count: count });
            }
          }
        }
      }
      
      // Convert to easier Array structure
      const results = Object.keys(aggregated).map(line => ({
        line,
        count: aggregated[line].count,
        prefectures: Array.from(aggregated[line].prefectures),
        stations: aggregated[line].stations.sort((a, b) => a.name.localeCompare(b.name))
      })).sort((a,b) => a.line.localeCompare(b.line));

      return results;
    } catch(e) {
      console.error("getRailLinesAndStations Error", e);
      return [];
    }
}


export async function getAuthorityStats(): Promise<{
  bit: { name: string; count: number }[];
  nta: { name: string; count: number }[];
}> {
    try {
      const [bitData, ntaData] = await Promise.all([
        prisma.property.groupBy({
          by: ['court_name'],
          where: { status: 'ACTIVE', source_provider: 'BIT' },
          _count: { _all: true },
          orderBy: { _count: { court_name: 'desc' } }
        }),
        prisma.property.groupBy({
          by: ['managing_authority'],
          where: { status: 'ACTIVE', source_provider: 'NTA' },
          _count: { _all: true },
          orderBy: { _count: { managing_authority: 'desc' } }
        })
      ]);

      return {
        bit: bitData
          .filter((r: any) => r.court_name)
          .map((r: any) => ({ name: r.court_name, count: r._count._all })),
        nta: ntaData
          .filter((r: any) => r.managing_authority)
          .map((r: any) => ({ name: (r.managing_authority || '').replace(/\s+/g, ' ').trim(), count: r._count._all }))
      };
    } catch (e) {
      console.error('getAuthorityStats Error', e);
      return { bit: [], nta: [] };
    }
}
