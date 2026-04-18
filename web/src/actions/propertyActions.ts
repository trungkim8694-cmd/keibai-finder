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

export async function getProperties(filters: SearchFilters = {}) {
  console.log(">>> [DEBUG getProperties API CALLED]", JSON.stringify(filters));
  try {
    let data: any[] = [];
    
    // 1. Initialize AND array with mandatory status filter
    const andConditions: any[] = [{ status: 'ACTIVE' }];

    // 2. Map Bounds
    if (filters.bounds && filters.bounds.sw && filters.bounds.ne) {
      andConditions.push({
        lat: { gte: filters.bounds.sw.lat, lte: filters.bounds.ne.lat },
        lng: { gte: filters.bounds.sw.lng, lte: filters.bounds.ne.lng }
      });
    }

    // 3. Property Types
    if (filters.types && filters.types.length > 0) {
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

    // 4. Prefectures
    if (filters.prefectures && filters.prefectures.length > 0) {
      andConditions.push({ prefecture: { in: filters.prefectures } });
    } else if (filters.prefecture) {
      andConditions.push({ prefecture: filters.prefecture });
    }

    // 5. Providers (BIT / NTA)
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

    // 6. Railway Lines & Stations
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

    // 7. Price, Area, Time
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

    // 8. Keyword Search
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

    // Final Where Clause Construction
    const whereClause: any = { AND: andConditions };
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
        by: ['line_name', 'nearest_station'],
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
      const aggregated: Record<string, { count: number, stations: string[] }> = {};
      for (const item of data) {
        const line = (item as any).line_name;
        const station = (item as any).nearest_station;
        const count = item._count._all;
        
        if (line && station) {
          if (!aggregated[line]) {
            aggregated[line] = { count: 0, stations: [] };
          }
          aggregated[line].count += count;
          
          // Assuming nearest_station represents the pure station name now
          if (!aggregated[line].stations.includes(station)) {
            aggregated[line].stations.push(station);
          }
        }
      }
      
      // Convert to easier Array structure
      const results = Object.keys(aggregated).map(line => ({
        line,
        count: aggregated[line].count,
        stations: aggregated[line].stations.sort()
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
