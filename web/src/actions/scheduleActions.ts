'use server';

import { prisma } from '@/lib/prisma';

export interface ScheduleDayItem {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  total: number;
  prefectures: { prefecture: string; count: number }[];
  courts: { court: string; count: number }[];
}

export interface ScheduleMonthStats {
  totalProperties: number;
  bitCount: number;
  ntaCount: number;
  activePrefecturesCount: number;
  peakDate: string | null;
  peakCount: number;
  regionCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  priceRanges: Record<string, number>;
}

export interface ScheduleDataResponse {
  year: number;
  month: number;
  provider: 'ALL' | 'BIT' | 'NTA';
  mode: 'end_date' | 'start_date';
  days: ScheduleDayItem[];
  stats: ScheduleMonthStats;
}

// B2B Japanese Regional Mapping
const REGION_MAP: Record<string, string[]> = {
  '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  '甲信越・北陸': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県'],
  '東海': ['岐阜県', '静岡県', '愛知県', '三重県'],
  '関西': ['滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
  '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県']
};

export async function getAuctionSchedule(
  year: number,
  month: number,
  provider: 'ALL' | 'BIT' | 'NTA' = 'ALL',
  mode: 'end_date' | 'start_date' = 'end_date'
): Promise<ScheduleDataResponse> {
  try {
    // 1. Calculate Start & End of Month in JST (UTC+9)
    const startDate = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0));
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = new Date(Date.UTC(nextYear, nextMonth - 1, 1, -9, 0, 0));

    const dateField = mode === 'start_date' ? 'bid_start_date' : 'bid_end_date';

    // 2. Build where conditions
    const whereCondition: any = {
      [dateField]: {
        gte: startDate,
        lt: endDate
      }
    };

    if (provider !== 'ALL') {
      whereCondition.source_provider = provider;
    }

    // 3. Query properties within this month
    const properties = await prisma.property.findMany({
      where: whereCondition,
      select: {
        sale_unit_id: true,
        source_provider: true,
        court_name: true,
        property_type: true,
        prefecture: true,
        starting_price: true,
        bid_start_date: true,
        bid_end_date: true,
        status: true
      }
    });

    // 4. Group by Day (YYYY-MM-DD in JST)
    const dayMap = new Map<string, {
      total: number;
      prefMap: Map<string, number>;
      courtMap: Map<string, number>;
    }>();

    // Stats Accumulators
    let bitCount = 0;
    let ntaCount = 0;
    const uniquePrefectures = new Set<string>();
    const regionCounts: Record<string, number> = {
      '北海道・東北': 0,
      '関東': 0,
      '甲信越・北陸': 0,
      '東海': 0,
      '関西': 0,
      '中国': 0,
      '四国': 0,
      '九州・沖縄': 0
    };
    const typeCounts: Record<string, number> = {
      '戸建て': 0,
      'マンション': 0,
      '土地': 0,
      '農地': 0,
      'その他': 0
    };
    const priceRanges: Record<string, number> = {
      '〜50万円': 0,
      '50〜100万円': 0,
      '100〜200万円': 0,
      '200〜300万円': 0,
      '300〜500万円': 0,
      '500〜1,000万円': 0,
      '1,000〜2,000万円': 0,
      '2,000万円以上': 0
    };

    for (const p of properties) {
      const targetDate = mode === 'start_date' ? p.bid_start_date : p.bid_end_date;
      if (!targetDate) continue;

      // Convert date to JST string YYYY-MM-DD
      const jstDate = new Date(targetDate.getTime() + 9 * 3600 * 1000);
      const dateStr = jstDate.toISOString().slice(0, 10);

      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, {
          total: 0,
          prefMap: new Map<string, number>(),
          courtMap: new Map<string, number>()
        });
      }

      const dayObj = dayMap.get(dateStr)!;
      dayObj.total += 1;

      // Pref aggregation
      const pref = p.prefecture || 'その他';
      uniquePrefectures.add(pref);
      dayObj.prefMap.set(pref, (dayObj.prefMap.get(pref) || 0) + 1);

      // Court aggregation
      const court = p.court_name || '裁判所/税務署';
      dayObj.courtMap.set(court, (dayObj.courtMap.get(court) || 0) + 1);

      // Provider counts
      if (p.source_provider === 'BIT') bitCount++;
      else if (p.source_provider === 'NTA') ntaCount++;

      // Region aggregation
      for (const [regionName, prefList] of Object.entries(REGION_MAP)) {
        if (prefList.includes(pref)) {
          regionCounts[regionName] = (regionCounts[regionName] || 0) + 1;
          break;
        }
      }

      // Type aggregation
      const pType = p.property_type || 'その他';
      if (['戸建て', 'マンション', '土地', '農地'].includes(pType)) {
        typeCounts[pType] += 1;
      } else {
        typeCounts['その他'] += 1;
      }

      // Price range aggregation
      if (p.starting_price !== null && p.starting_price !== undefined) {
        const priceYen = Number(p.starting_price);
        if (priceYen < 500_000) priceRanges['〜50万円'] += 1;
        else if (priceYen < 1_000_000) priceRanges['50〜100万円'] += 1;
        else if (priceYen < 2_000_000) priceRanges['100〜200万円'] += 1;
        else if (priceYen < 3_000_000) priceRanges['200〜300万円'] += 1;
        else if (priceYen < 5_000_000) priceRanges['300〜500万円'] += 1;
        else if (priceYen < 10_000_000) priceRanges['500〜1,000万円'] += 1;
        else if (priceYen < 20_000_000) priceRanges['1,000〜2,000万円'] += 1;
        else priceRanges['2,000万円以上'] += 1;
      }
    }

    // 5. Construct full calendar grid (including leading/trailing pad days)
    // Days in current month
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 1 = Monday,...

    const scheduleDays: ScheduleDayItem[] = [];

    // Calculate Peak Day
    let peakDate: string | null = null;
    let peakCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const itemData = dayMap.get(dateKey);
      const total = itemData ? itemData.total : 0;

      if (total > peakCount) {
        peakCount = total;
        peakDate = dateKey;
      }

      const prefectures = itemData
        ? Array.from(itemData.prefMap.entries())
            .map(([prefecture, count]) => ({ prefecture, count }))
            .sort((a, b) => b.count - a.count)
        : [];

      const courts = itemData
        ? Array.from(itemData.courtMap.entries())
            .map(([court, count]) => ({ court, count }))
            .sort((a, b) => b.count - a.count)
        : [];

      scheduleDays.push({
        date: dateKey,
        dayNumber: day,
        isCurrentMonth: true,
        total,
        prefectures,
        courts
      });
    }

    return {
      year,
      month,
      provider,
      mode,
      days: scheduleDays,
      stats: {
        totalProperties: properties.length,
        bitCount,
        ntaCount,
        activePrefecturesCount: uniquePrefectures.size,
        peakDate,
        peakCount,
        regionCounts,
        typeCounts,
        priceRanges
      }
    };
  } catch (error) {
    console.error('getAuctionSchedule error:', error);
    return {
      year,
      month,
      provider,
      mode,
      days: [],
      stats: {
        totalProperties: 0,
        bitCount: 0,
        ntaCount: 0,
        activePrefecturesCount: 0,
        peakDate: null,
        peakCount: 0,
        regionCounts: {},
        typeCounts: {},
        priceRanges: {}
      }
    };
  }
}

export async function getScheduleDayProperties(
  dateStr: string,
  provider: 'ALL' | 'BIT' | 'NTA' = 'ALL',
  prefecture?: string,
  mode: 'end_date' | 'start_date' = 'end_date'
) {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return [];
    const [y, m, d] = parts.map(Number);

    // Day interval in JST
    const startOfDay = new Date(Date.UTC(y, m - 1, d, -9, 0, 0));
    const endOfDay = new Date(Date.UTC(y, m - 1, d + 1, -9, 0, 0));

    const dateField = mode === 'start_date' ? 'bid_start_date' : 'bid_end_date';

    const where: any = {
      [dateField]: {
        gte: startOfDay,
        lt: endOfDay
      }
    };

    if (provider !== 'ALL') {
      where.source_provider = provider;
    }

    if (prefecture && prefecture !== 'ALL') {
      where.prefecture = prefecture;
    }

    const properties = await prisma.property.findMany({
      where,
      select: {
        sale_unit_id: true,
        source_provider: true,
        court_name: true,
        managing_authority: true,
        property_type: true,
        address: true,
        prefecture: true,
        city: true,
        starting_price: true,
        thumbnailUrl: true,
        images: true,
        bid_start_date: true,
        bid_end_date: true,
        status: true,
        nearest_station: true,
        walk_time_to_station: true,
        area: true
      },
      orderBy: {
        starting_price: 'asc'
      },
      take: 100
    });

    return properties.map(p => ({
      ...p,
      starting_price: p.starting_price !== null ? Number(p.starting_price) : null
    }));
  } catch (err) {
    console.error('getScheduleDayProperties error:', err);
    return [];
  }
}
