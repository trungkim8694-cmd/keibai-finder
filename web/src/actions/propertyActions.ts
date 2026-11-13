'use server';

import { prisma } from '@/lib/prisma';
import { calculateRoi, convertToWesternYear, extractAuctionSchedule, extractAuctionRoundFromData, extractTotalArea } from '@/lib/utils';
import { resolveCityCode } from '@/lib/mlitApi';
import { formatBidPeriod } from '@/utils/dateFormatter';
import { revalidatePath, unstable_cache } from 'next/cache';
import { headers } from 'next/headers';
import { parseSmartKeyword } from '@/lib/keywordParser';
import { resolveAuctionRelistHistory } from '@/lib/propertyDataNormalizer';

let relistLookupCache: { timestamp: number; map: Map<string, { roundCount: number; priceDropYen: number }> } | null = null;
const RELIST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getActiveRelistLookupMap(): Promise<Map<string, { roundCount: number; priceDropYen: number }>> {
  if (relistLookupCache && Date.now() - relistLookupCache.timestamp < RELIST_CACHE_TTL_MS) {
    return relistLookupCache.map;
  }
  const map = new Map<string, { roundCount: number; priceDropYen: number }>();
  try {
    const rows = await prisma.$queryRaw<Array<{
      sale_unit_id: string;
      address: string;
      property_type: string;
      area: number | null;
      starting_price: bigint | number | null;
      status: string;
      raw_display_data: any;
      thumbnailUrl: string | null;
      images: string[] | null;
      source_provider: string;
    }>>`
      SELECT p.sale_unit_id, p.address, p.property_type, p.area, p.starting_price, p.status, p.raw_display_data, p."thumbnailUrl", p.images, p.source_provider
      FROM "Property" p
      WHERE p.address IN (
        SELECT address FROM "Property"
        WHERE status = 'ACTIVE' AND address IS NOT NULL AND address != 'Unknown'
      )
    `;

    const byKey = new Map<string, any[]>();
    for (const r of rows) {
      const k = `${r.address}__${r.property_type}`;
      const list = byKey.get(k) || [];
      list.push(r);
      byKey.set(k, list);
    }

    for (const [, group] of byKey.entries()) {
      if (group.length <= 1) continue;
      const activeItems = group.filter(g => g.status === 'ACTIVE');
      for (const activeProp of activeItems) {
        const summary = resolveAuctionRelistHistory(activeProp, group);
        if (summary.totalRounds > 1 || summary.priceDropYen > 0) {
          map.set(String(activeProp.sale_unit_id), {
            roundCount: summary.totalRounds,
            priceDropYen: summary.priceDropYen,
          });
        }
      }
    }
    relistLookupCache = { timestamp: Date.now(), map };
  } catch (err) {
    console.error('Failed to build relist lookup map:', err);
  }
  return map;
}

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
      const activeCondition = {
        status: 'ACTIVE',
        OR: [
          { bid_end_date: { gte: new Date() } },
          { bid_end_date: null }
        ]
      };

      const stats = await prisma.property.groupBy({
        by: ['prefecture'],
        where: activeCondition,
        _count: { _all: true },
      });
      
      const total = await prisma.property.count({ where: activeCondition });
      
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
  }, ['area_stats_cache_v2'], { revalidate: 3600, tags: ['stats'] })();
}

export async function getCityStats(prefecture: string) {
  try {
    const stats = await prisma.property.groupBy({
      by: ['city'],
      where: { 
        status: 'ACTIVE',
        prefecture: prefecture,
        city: { not: null },
        OR: [
          { bid_end_date: { gte: new Date() } },
          { bid_end_date: null }
        ]
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
        where: { 
          status: 'ACTIVE',
          OR: [
            { bid_end_date: { gte: new Date() } },
            { bid_end_date: null }
          ]
        },
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
      where: { 
        status: 'ACTIVE',
        OR: [
          { bid_end_date: { gte: new Date() } },
          { bid_end_date: null }
        ]
      }
    });
  } catch(e) {
    console.error("Total properties count error", e);
    return 0;
  }
}


export interface SearchSuggestion {
  type: 'STATION' | 'LINE' | 'CITY' | 'ADDRESS' | 'COURT' | 'CASE';
  text: string;
  subtext?: string;
  count?: number;
}

const suggestionsCache = new Map<string, { timestamp: number; data: SearchSuggestion[] }>();
const SUGGESTIONS_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    if (!query || query.trim().length < 2) return [];
    const normalizedQuery = query.trim();

    const cached = suggestionsCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < SUGGESTIONS_TTL_MS) {
      return cached.data;
    }

    if (suggestionsCache.size > 500) {
      suggestionsCache.clear();
    }

    const qStr = `%${normalizedQuery}%`;
    const results: SearchSuggestion[] = [];

    // Parallel lookup across Stations, Lines, Cities, Courts, Authorities, Cases with counts
    const [stations, lines, locations, courts, authorities, cases] = await Promise.all([
      prisma.$queryRaw<Array<{ text: string; count: number }>>`
        SELECT "nearest_station" as text, COUNT(*)::int as count
        FROM "Property"
        WHERE "status" = 'ACTIVE' AND "nearest_station" ILIKE ${qStr} AND "nearest_station" IS NOT NULL
        GROUP BY "nearest_station"
        ORDER BY count DESC
        LIMIT 3
      `.catch(() => []),
      prisma.$queryRaw<Array<{ text: string; count: number }>>`
        SELECT "line_name" as text, COUNT(*)::int as count
        FROM "Property"
        WHERE "status" = 'ACTIVE' AND "line_name" ILIKE ${qStr} AND "line_name" IS NOT NULL
        GROUP BY "line_name"
        ORDER BY count DESC
        LIMIT 2
      `.catch(() => []),
      prisma.$queryRaw<Array<{ prefecture: string; city: string; count: number }>>`
        SELECT "prefecture", "city", COUNT(*)::int as count
        FROM "Property"
        WHERE "status" = 'ACTIVE' AND ("prefecture" ILIKE ${qStr} OR "city" ILIKE ${qStr})
        GROUP BY "prefecture", "city"
        ORDER BY count DESC
        LIMIT 3
      `.catch(() => []),
      prisma.$queryRaw<Array<{ text: string; count: number }>>`
        SELECT "court_name" as text, COUNT(*)::int as count
        FROM "Property"
        WHERE "status" = 'ACTIVE' AND "court_name" ILIKE ${qStr}
        GROUP BY "court_name"
        ORDER BY count DESC
        LIMIT 2
      `.catch(() => []),
      prisma.$queryRaw<Array<{ text: string; count: number }>>`
        SELECT "managing_authority" as text, COUNT(*)::int as count
        FROM "Property"
        WHERE "status" = 'ACTIVE' AND "managing_authority" ILIKE ${qStr} AND "managing_authority" IS NOT NULL
        GROUP BY "managing_authority"
        ORDER BY count DESC
        LIMIT 2
      `.catch(() => []),
      prisma.$queryRaw<Array<{ text: string; subtext: string }>>`
        SELECT "sale_unit_id" as text, "address" as subtext
        FROM "Property"
        WHERE "status" = 'ACTIVE' AND "sale_unit_id" ILIKE ${qStr}
        LIMIT 2
      `.catch(() => [])
    ]);

    stations.forEach(s => s.text && results.push({ type: 'STATION', text: s.text, count: s.count }));
    lines.forEach(l => l.text && results.push({ type: 'LINE', text: l.text, count: l.count }));
    
    locations.forEach(loc => {
      const qLower = normalizedQuery.toLowerCase();
      if (loc.city && loc.city.toLowerCase().includes(qLower)) {
         if (!results.find(r => r.text === loc.city)) {
           results.push({ type: 'CITY', text: loc.city, subtext: loc.prefecture, count: loc.count });
         }
      } else if (loc.prefecture && loc.prefecture.toLowerCase().includes(qLower)) {
         if (!results.find(r => r.text === loc.prefecture)) {
            results.push({ type: 'CITY', text: loc.prefecture, count: loc.count });
         }
      }
    });

    courts.forEach(c => c.text && results.push({ type: 'COURT', text: c.text, subtext: '競売 (BIT)', count: c.count }));
    authorities.forEach(a => a.text && results.push({ type: 'COURT', text: a.text, subtext: '公売 (国税局)', count: a.count }));
    cases.forEach(k => k.text && results.push({ type: 'CASE', text: k.text, subtext: k.subtext }));

    suggestionsCache.set(normalizedQuery, { timestamp: Date.now(), data: results });
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
  maxWalkTime?: number;
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

  // Parse smart natural language query if keyword is provided
  const parsedKeyword = filters.keyword ? parseSmartKeyword(filters.keyword) : null;

  // Harmonize extracted quantitative filters with explicit filters
  const effectiveMinPrice = filters.minPrice ?? parsedKeyword?.extractedFilters.minPrice;
  const effectiveMaxPrice = filters.maxPrice ?? parsedKeyword?.extractedFilters.maxPrice;
  const effectiveMaxWalkTime = filters.maxWalkTime ?? parsedKeyword?.extractedFilters.maxWalkTime;
  const effectiveMinArea = filters.minArea ?? parsedKeyword?.extractedFilters.minArea;
  const effectiveTypes = (filters.types && filters.types.length > 0)
    ? filters.types
    : (parsedKeyword?.extractedFilters.types && parsedKeyword.extractedFilters.types.length > 0 ? parsedKeyword.extractedFilters.types : undefined);

  if (filters.bounds && filters.bounds.sw && filters.bounds.ne && exclude !== 'prefectures') {
    andConditions.push({
      lat: { gte: filters.bounds.sw.lat, lte: filters.bounds.ne.lat },
      lng: { gte: filters.bounds.sw.lng, lte: filters.bounds.ne.lng }
    });
  }

  if (exclude !== 'types' && effectiveTypes && effectiveTypes.length > 0) {
    if (effectiveTypes.includes('その他')) {
      const explicitTypes = effectiveTypes.filter(t => t !== 'その他');
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
      andConditions.push({ property_type: { in: effectiveTypes } });
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
    let activeProviders = filters.providers && filters.providers.length > 0
      ? [...filters.providers]
      : (filters.provider && filters.provider !== 'ALL' ? [filters.provider] : ['BIT', 'NTA', 'KSI', 'MOF']);

    const hasCourtFilter = Boolean(filters.courtName && filters.courtName !== 'ALL');
    const hasNtaFilter = Boolean(filters.managingAuthority && filters.managingAuthority !== 'ALL');

    // Resolve conflicts when a specific Court or Tax Office is selected
    if (filters.provider && filters.provider !== 'ALL') {
      activeProviders = [filters.provider];
    } else if (hasCourtFilter && !hasNtaFilter) {
      activeProviders = ['BIT'];
    } else if (hasNtaFilter && !hasCourtFilter) {
      activeProviders = ['NTA'];
    }

    const providerOrConditions: any[] = [];
    
    if (activeProviders.includes('BIT')) {
      const bitCondition: any = { source_provider: 'BIT' };
      if (hasCourtFilter) {
         bitCondition.court_name = filters.courtName;
      }
      providerOrConditions.push(bitCondition);
    }

    if (activeProviders.includes('NTA')) {
      const ntaCondition: any = { source_provider: 'NTA' };
      if (hasNtaFilter && filters.managingAuthority) {
         ntaCondition.managing_authority = { contains: filters.managingAuthority.split(' ')[0] };
      }
      providerOrConditions.push(ntaCondition);
    }

    if (activeProviders.includes('KSI')) {
      providerOrConditions.push({ source_provider: 'KSI' });
    }

    if (activeProviders.includes('MOF')) {
      providerOrConditions.push({ source_provider: 'MOF' });
    }

    if (providerOrConditions.length === 1) {
      andConditions.push(providerOrConditions[0]);
    } else if (providerOrConditions.length > 1 && (activeProviders.length < 4 || hasCourtFilter || hasNtaFilter)) {
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

  if (effectiveMaxWalkTime) {
    andConditions.push({ walk_time_to_station: { lte: effectiveMaxWalkTime } });
  }

  if (effectiveMinPrice || effectiveMaxPrice) {
    const priceFilter: any = {};
    if (effectiveMinPrice) priceFilter.gte = effectiveMinPrice;
    if (effectiveMaxPrice) priceFilter.lte = effectiveMaxPrice;
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
  } else {
    andConditions.push({
      OR: [
        { bid_end_date: { gte: new Date() } },
        { bid_end_date: null }
      ]
    });
  }
  
  if (effectiveMinArea) {
    andConditions.push({ area: { gte: effectiveMinArea } });
  }

  // Multi-token AND search across 10 fields + Chome & Synonym variants
  if (parsedKeyword && parsedKeyword.textTokens.length > 0) {
    for (const token of parsedKeyword.textTokens) {
      const variants = parsedKeyword.tokenVariants[token] || [token];
      const tokenOrConditions: any[] = [];
      for (const variant of variants) {
        tokenOrConditions.push(
          { address: { contains: variant, mode: 'insensitive' } },
          { nearest_station: { contains: variant, mode: 'insensitive' } },
          { line_name: { contains: variant, mode: 'insensitive' } },
          { prefecture: { contains: variant, mode: 'insensitive' } },
          { city: { contains: variant, mode: 'insensitive' } },
          { court_name: { contains: variant, mode: 'insensitive' } },
          { managing_authority: { contains: variant, mode: 'insensitive' } },
          { property_type: { contains: variant, mode: 'insensitive' } },
          { sale_unit_id: { contains: variant, mode: 'insensitive' } },
          { raw_text: { contains: variant, mode: 'insensitive' } }
        );
      }
      andConditions.push({ OR: tokenOrConditions });
    }
  }
  
  return { AND: andConditions };
}

const facetedStatsCache = new Map<string, { timestamp: number; data: any }>();
const FACETED_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function getFacetedStats(filters: SearchFilters = {}) {
  try {
    const cacheKey = JSON.stringify(filters);
    const cached = facetedStatsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < FACETED_CACHE_TTL_MS) {
      return cached.data;
    }
    if (facetedStatsCache.size > 200) {
      facetedStatsCache.clear();
    }

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
    }).then(res => {
      let total = 0;
      const map = res.reduce((acc, curr) => {
        const count = curr._count._all;
        total += count;
        if (curr.prefecture) acc[curr.prefecture] = count;
        return acc;
      }, {} as Record<string, number>);
      map['全国'] = total;
      return map;
    });

    const authWhere = buildWhereClause(filters, 'provider');
    const authPromise = (async () => {
       const [bitStats, ntaStats] = await Promise.all([
         prisma.property.groupBy({
           by: ['court_name'],
           where: { ...authWhere, source_provider: 'BIT' },
           _count: { _all: true },
         }),
         prisma.property.groupBy({
           by: ['managing_authority'],
           where: { ...authWhere, source_provider: 'NTA' },
           _count: { _all: true },
         })
       ]);
       
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
    const railPromise = prisma.property.groupBy({
      by: ['line_name', 'nearest_station'],
      where: { ...railWhere, line_name: { notIn: ['', 'null'], not: null } },
      _count: { _all: true },
    }).then(groupedData => {
      const lineMap: Record<string, Set<string>> = {};
      const lineCounts: Record<string, number> = {};

      groupedData.forEach(p => {
        if (!p.line_name) return;
        const rowCount = p._count._all;
        
        const lines = p.line_name.includes(',') ? p.line_name.split(',').map(s => s.trim()) : [p.line_name.trim()];
        const stations = (p.nearest_station && p.nearest_station.includes(','))
          ? p.nearest_station.split(',').map(s => s.trim())
          : [p.nearest_station?.trim() || ''];

        lines.forEach(line => {
          if (!line) return;
          if (!lineMap[line]) {
            lineMap[line] = new Set();
            lineCounts[line] = 0;
          }
          lineCounts[line] += rowCount;
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

    const finalStats = { typeStats, areaStats, authorityStats, railData };
    facetedStatsCache.set(cacheKey, { timestamp: Date.now(), data: finalStats });
    return finalStats;
  } catch (err) {
     console.error("Faceted calculation error:", err);
     return { typeStats: {}, areaStats: {}, authorityStats: { bit: [], nta: [] }, railData: [] };
  }
}

const mapPayloadCache = new Map<string, { timestamp: number; data: any[] }>();
const MAP_CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function getPropertiesCore(filters: SearchFilters) {
  try {
    let data: any[] = [];
    
    const whereClause = buildWhereClause(filters);

        let effectiveSort = filters.sort === 'views' ? 'viewsDesc' : (filters.sort || filters.sortBy);
        
        let defaultOrderBy: any = { created_at: 'desc' };
        if (effectiveSort) {
           if (effectiveSort === 'newest') defaultOrderBy = { created_at: 'desc' };
           else if (effectiveSort === 'priceAsc') defaultOrderBy = { starting_price: { sort: 'asc', nulls: 'last' } };
           else if (effectiveSort === 'areaDesc') defaultOrderBy = { area: { sort: 'desc', nulls: 'last' } };
           else if (effectiveSort === 'viewsDesc') defaultOrderBy = { views: 'desc' };
           else if (effectiveSort === 'bid_start_asc') defaultOrderBy = { bid_start_date: { sort: 'asc', nulls: 'last' } };
           else if (effectiveSort === 'bid_start_desc') defaultOrderBy = { bid_start_date: { sort: 'desc', nulls: 'last' } };
           else if (effectiveSort === 'ending') defaultOrderBy = { bid_end_date: { sort: 'asc', nulls: 'last' } };
           else if (effectiveSort === 'gap_desc') defaultOrderBy = { mlit_investment_gap: { sort: 'desc', nulls: 'last' } };
        }

        if (filters.isMapPayload) {
            const mapCacheKey = JSON.stringify({ whereClause, defaultOrderBy });
            const cachedMap = mapPayloadCache.get(mapCacheKey);
            if (cachedMap && Date.now() - cachedMap.timestamp < MAP_CACHE_TTL_MS) {
              return cachedMap.data;
            }
            if (mapPayloadCache.size > 100) {
              mapPayloadCache.clear();
            }

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
                status: true,
                court_name: true,
                address: true,
                views: true,
                thumbnailUrl: true,
                prefecture: true,
                city: true,
                area: true,
                bid_start_date: true,
                bid_end_date: true,
                created_at: true,
                line_name: true,
                nearest_station: true,
                walk_time_to_station: true,
                managing_authority: true,
                mlit_investment_gap: true,
                mlit_estimated_price: true,
              },
              take: 2000,
              orderBy: defaultOrderBy
            });
            
            const coordinateMap = new Map();
            const relistMap = await getActiveRelistLookupMap();

            const mappedPayload = data.map((d: any) => {
               const relistInfo = relistMap.get(String(d.sale_unit_id));
               let lat = d.lat ? Number(d.lat) : null;
               let lng = d.lng ? Number(d.lng) : null;
               if (lat && lng) {
                  const key = `${lat.toFixed(5)}-${lng.toFixed(5)}`;
                  const count = coordinateMap.get(key) || 0;
                  if (count > 0) {
                     lat += (Math.random() - 0.5) * 0.00002;
                     lng += (Math.random() - 0.5) * 0.00002;
                  }
                  coordinateMap.set(key, count + 1);
               }

               const resolvedThumb = d.thumbnailUrl
                 ? (d.thumbnailUrl.startsWith('./')
                     ? `https://www.koubai.nta.go.jp/auctionx/public${d.thumbnailUrl.substring(1)}`
                     : d.thumbnailUrl.replace('bit.sikkou.jp', 'www.bit.courts.go.jp'))
                 : null;

               const resolvedArea = d.area != null ? Math.round(Number(d.area)) : null;
               const auctionSchedule = formatBidPeriod(d.bid_start_date, d.bid_end_date);

               return {
                 sale_unit_id: d.sale_unit_id,
                 source_provider: d.source_provider,
                 source_url: d.source_url,
                 lat,
                 lng,
                 property_type: d.property_type,
                 starting_price: typeof d.starting_price === 'bigint' ? Number(d.starting_price) : d.starting_price,
                 status: d.status,
                 court_name: d.court_name,
                 address: d.address,
                 views: d.views,
                 thumbnailUrl: resolvedThumb,
                 prefecture: d.prefecture,
                 city: d.city,
                 area: resolvedArea,
                 bid_start_date: d.bid_start_date,
                 bid_end_date: d.bid_end_date,
                 created_at: d.created_at,
                 line_name: d.line_name,
                 nearest_station: d.nearest_station,
                 walk_time_to_station: d.walk_time_to_station,
                 managing_authority: d.managing_authority,
                 auctionSchedule,
                 auctionRound: relistInfo ? relistInfo.roundCount : 1,
                 priceDropYen: relistInfo ? relistInfo.priceDropYen : 0,
                 mlit_investment_gap: d.mlit_investment_gap,
                 mlit_estimated_price: typeof d.mlit_estimated_price === 'bigint' ? Number(d.mlit_estimated_price) : d.mlit_estimated_price,
               };
            });

            mapPayloadCache.set(mapCacheKey, { timestamp: Date.now(), data: mappedPayload });
            return mappedPayload;
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const listCacheKey = JSON.stringify({ whereClause, defaultOrderBy, page, limit });
        const cachedList = mapPayloadCache.get(listCacheKey);
        if (cachedList && Date.now() - cachedList.timestamp < MAP_CACHE_TTL_MS) {
          return cachedList.data;
        }
        
        data = await prisma.property.findMany({
          where: whereClause,
          select: {
            sale_unit_id: true,
            source_provider: true,
            source_url: true,
            court_name: true,
            property_type: true,
            address: true,
            prefecture: true,
            city: true,
            lat: true,
            lng: true,
            starting_price: true,
            status: true,
            views: true,
            thumbnailUrl: true,
            raw_display_data: true,
            build_year_western: true,
            images: true,
            area: true,
            bid_start_date: true,
            bid_end_date: true,
            created_at: true,
            managing_authority: true,
            line_name: true,
            nearest_station: true,
            walk_time_to_station: true,
            mlit_estimated_price: true,
            mlit_investment_gap: true,
          },
          orderBy: defaultOrderBy,
          skip: (page - 1) * limit,
          take: limit
        });

    const mappedList = await mapPropertiesWithStations(data);
    mapPayloadCache.set(listCacheKey, { timestamp: Date.now(), data: mappedList });
    return mappedList;
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
  // In development, or for map payloads, bypass Next.js data cache to ensure real-time fresh data
  if (process.env.NODE_ENV === 'development' || filters.isMapPayload) {
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
    const relistMap = await getActiveRelistLookupMap();
    // MAP TO SHARED FORMAT
    const formattedData = await Promise.all(data.map(async p => {
      const relistInfo = relistMap.get(String(p.sale_unit_id));
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
      
      const auctionRound = relistInfo ? relistInfo.roundCount : extractAuctionRoundFromData(p.raw_display_data);
      const priceDropYen = relistInfo ? relistInfo.priceDropYen : 0;

        const rawImages = p.images || [];
        const mappedImages = rawImages.map((img: string) => 
            img.startsWith('./') ? `https://www.koubai.nta.go.jp/auctionx/public${img.substring(1)}` : img
        );

        // Sort images so permanent storage (VPS Nginx, Cloudflare R2, Supabase) comes first
        const isPermanent = (url: string) => Boolean(url && (url.startsWith('/vps-images/') || url.includes('r2.dev') || url.includes('supabase.co')));
        const sortedImages = [...mappedImages].sort((a, b) => {
            const aPerm = isPermanent(a);
            const bPerm = isPermanent(b);
            if (aPerm && !bPerm) return -1;
            if (!aPerm && bPerm) return 1;
            return 0;
        });

        // Priority for thumbnail:
        // 1. Permanent image in images (Cloudflare R2 / Supabase)
        // 2. NTA first image if NTA
        // 3. thumbnailUrl if exists (with bit.sikkou.jp domain fix)
        // 4. First image in sortedImages
        const permanentImage = sortedImages.find(isPermanent);
        const mappedThumbnail = permanentImage
          ? permanentImage
          : ((p.source_provider === 'NTA' || p.source_provider === 'KSI') && sortedImages.length > 0
              ? sortedImages[0]
              : (p.thumbnailUrl 
                  ? p.thumbnailUrl.replace('bit.sikkou.jp', 'www.bit.courts.go.jp') 
                  : (sortedImages.length > 0 ? sortedImages[0] : null)));

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
          priceDropYen: priceDropYen,
          thumbnailUrl: mappedThumbnail,
          images: sortedImages,
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
      const activeCondition = {
        status: 'ACTIVE',
        OR: [
          { bid_end_date: { gte: new Date() } },
          { bid_end_date: null }
        ]
      };

      const [bitData, ntaData] = await Promise.all([
        prisma.property.groupBy({
          by: ['court_name'],
          where: { ...activeCondition, source_provider: 'BIT' },
          _count: { _all: true },
          orderBy: { _count: { court_name: 'desc' } }
        }),
        prisma.property.groupBy({
          by: ['managing_authority'],
          where: { ...activeCondition, source_provider: 'NTA' },
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
