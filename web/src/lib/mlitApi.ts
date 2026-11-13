import { prisma } from './prisma';

const MLIT_API_KEY = process.env.MLIT_API_KEY || "";
const BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external";

export type MlitTransaction = {
  TradePrice: string;             // 取引価格（総額）
  PricePerUnit?: string;          // 坪単価
  UnitPrice?: string;             // ㎡単価
  Area?: string;                  // 面積（㎡）
  BuildingYear?: string;          // 建築年 (例: 昭和63年, 2018年)
  Period?: string;                // 取引時期 (例: 2023年第3四半期)
  Type?: string;                  // 種類 (宅地(土地と建物), 中古マンション等)
  Prefecture?: string;            // 都道府県名
  Municipality?: string;          // 市区町村名
  DistrictName?: string;          // 地区名
  FloorPlan?: string;             // 間取り (例: 3LDK, 1K)
  Structure?: string;             // 建物の構造 (RC, 木造, 鉄骨造)
  NearestStation?: string;        // 最寄駅：名称
  TimeToNearestStation?: string;  // 最寄駅：徒歩分数 (分)
  TotalFloorArea?: string;        // 延床面積（㎡）
  CityPlanning?: string;          // 都市計画区域
  CoverageRatio?: string;         // 建ぺい率（％）
  FloorAreaRatio?: string;        // 容積率（％）
  Renovation?: string;            // 改装 (未改装 / 改装済)
  Direction?: string;             // 前面道路：方位
  Classification?: string;        // 前面道路：種類
  Breadth?: string;               // 前面道路：幅員（ｍ）
};

/**
 * MLIT Property Types Mapping
 * - "戸建て" (House) -> 宅地(土地と建物) (Land and Building)
 * - "マンション" (Mansion) -> 中古マンション等 (Used Mansion)
 * - "土地" (Land) -> 宅地(土地) (Land) or 林地 / 農地
 */
export function mapPropertyTypeToMlit(keibaiType: string): string[] {
  if (['戸建て', '店舗・旅館', '事務所・ビル', '工場・倉庫', '一棟マンション・アパート'].includes(keibaiType)) {
    return ['宅地(土地と建物)'];
  }
  if (keibaiType === 'マンション') return ['中古マンション等'];
  if (['土地', '農地', '宅地（更地）', 'その他'].includes(keibaiType)) {
    return ['宅地(土地)', '林地', '農地'];
  }
  return ['宅地(土地と建物)', '宅地(土地)'];
}

/**
 * Fetch raw transactions from MLIT API (XIT001) for a specific year and city.
 */
export async function fetchMlitApiData(cityCode: string, year: string): Promise<MlitTransaction[]> {
  try {
    const response = await fetch(`${BASE_URL}/XIT001?year=${year}&city=${cityCode}`, {
      method: "GET",
      headers: {
         "Ocp-Apim-Subscription-Key": MLIT_API_KEY,
      },
      next: { revalidate: 604800 } // Cache API response internally for 7 days
    });
    
    if (!response.ok) {
       console.error(`MLIT API Error: ${response.status} ${response.statusText}`);
       return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("MLIT API Connection Failed:", error);
    return [];
  }
}

/**
 * Get Market Data from Cache or API
 * Reads/saves city-level data in mlitMarketCache (100% cache hit), then filters district in-memory if needed.
 */
export async function getMarketValuation(cityCode: string, propertyType: string, year: string = '2023', districtQuery: string = '') {
  if (!cityCode) return null;

  const mlitTypes = mapPropertyTypeToMlit(propertyType);
  const searchType = mlitTypes[0]; // Primary type for cache key
  
  // 1. Check Database Cache for City Level (Always cache city data)
  let cityTransactions: MlitTransaction[] | null = null;
  const cached = await prisma.mlitMarketCache.findUnique({
    where: {
      municipalityCode_propertyType_year: {
         municipalityCode: cityCode,
         propertyType: searchType,
         year: year
      }
    }
  });

  if (cached && (new Date().getTime() - cached.last_fetched_at.getTime() < 30 * 24 * 60 * 60 * 1000) && cached.transactions) {
     cityTransactions = cached.transactions as MlitTransaction[];
  }

  // 2. If not cached, fetch all from MLIT API
  if (!cityTransactions) {
    const allTrans = await fetchMlitApiData(cityCode, year);
    cityTransactions = allTrans.filter(t => t.Type && mlitTypes.includes(t.Type));

    // Save back to DB Cache (Latest 200 transactions)
    const recentToCache = cityTransactions.slice(0, 200);
    let cAvgPrice: number | null = null;
    let cAvgArea: number | null = null;
    let cAvgPricePerSqm: number | null = null;

    if (recentToCache.length > 0) {
      const total = recentToCache.reduce((sum, t) => sum + (Number(t.TradePrice) || 0), 0);
      cAvgPrice = Math.round(total / recentToCache.length);
      const transWithArea = recentToCache.map(t => {
        const areaNum = Number(t.Area?.replace(/[^0-9.]/g, ''));
        return { ...t, parsedArea: isNaN(areaNum) || areaNum === 0 ? null : areaNum };
      }).filter(t => t.parsedArea !== null);

      if (transWithArea.length > 0) {
        const totalArea = transWithArea.reduce((sum, t) => sum + t.parsedArea!, 0);
        cAvgArea = Math.round(totalArea / transWithArea.length);
        const totalPriceWithArea = transWithArea.reduce((sum, t) => sum + (Number(t.TradePrice) || 0), 0);
        cAvgPricePerSqm = Math.round(totalPriceWithArea / totalArea);
      }
    }

    try {
      await prisma.mlitMarketCache.upsert({
        where: {
          municipalityCode_propertyType_year: {
            municipalityCode: cityCode,
            propertyType: searchType,
            year: year
          }
        },
        update: {
          avgTradePrice: cAvgPrice,
          avgArea: cAvgArea,
          avgPricePerSqm: cAvgPricePerSqm,
          transactions: recentToCache,
          last_fetched_at: new Date()
        },
        create: {
          municipalityCode: cityCode,
          propertyType: searchType,
          year: year,
          avgTradePrice: cAvgPrice,
          avgArea: cAvgArea,
          avgPricePerSqm: cAvgPricePerSqm,
          transactions: recentToCache
        }
      });
    } catch (dbError) {
      console.error("Failed to save MLIT Cache:", dbError);
    }
  }

  // 3. In-memory district filtering if requested
  let matchedTrans = cityTransactions;
  if (districtQuery && matchedTrans.length > 0) {
    const filtered = matchedTrans.filter(t => t.DistrictName && districtQuery.startsWith(t.DistrictName));
    // If district has enough sample (>= 4), use it, otherwise keep full city dataset
    if (filtered.length >= 4) {
      matchedTrans = filtered;
    }
  }

  // 4. Compute metrics for the active slice
  let avgTradePrice: number | null = null;
  let avgArea: number | null = null;
  let avgPricePerSqm: number | null = null;
  
  if (matchedTrans.length > 0) {
     const total = matchedTrans.reduce((sum, t) => sum + (Number(t.TradePrice) || 0), 0);
     avgTradePrice = Math.round(total / matchedTrans.length);
     
     const transWithArea = matchedTrans.map(t => {
       const areaNum = Number(t.Area?.replace(/[^0-9.]/g, ''));
       return { ...t, parsedArea: isNaN(areaNum) || areaNum === 0 ? null : areaNum };
     }).filter(t => t.parsedArea !== null);

     if (transWithArea.length > 0) {
        const totalArea = transWithArea.reduce((sum, t) => sum + t.parsedArea!, 0);
        avgArea = Math.round(totalArea / transWithArea.length);
        const totalPriceWithArea = transWithArea.reduce((sum, t) => sum + (Number(t.TradePrice) || 0), 0);
        avgPricePerSqm = Math.round(totalPriceWithArea / totalArea);
     }
  }

  return {
    avgTradePrice,
    avgArea,
    avgPricePerSqm,
    count: matchedTrans.length,
    transactions: matchedTrans.slice(0, 100)
  };
}

/**
 * Prefecture Map to Area Code (01-47)
 */
const PREF_MAP: Record<string, string> = {
  "北海道": "01", "青森県": "02", "岩手県": "03", "宮城県": "04", "秋田県": "05", "山形県": "06", "福島県": "07",
  "茨城県": "08", "栃木県": "09", "群馬県": "10", "埼玉県": "11", "千葉県": "12", "東京都": "13", "神奈川県": "14",
  "新潟県": "15", "富山県": "16", "石川県": "17", "福井県": "18", "山梨県": "19", "長野県": "20", "岐阜県": "21",
  "静岡県": "22", "愛知県": "23", "三重県": "24", "滋賀県": "25", "京都府": "26", "大阪府": "27", "兵庫県": "28",
  "奈良県": "29", "和歌山県": "30", "鳥取県": "31", "島根県": "32", "岡山県": "33", "広島県": "34", "山口県": "35",
  "徳島県": "36", "香川県": "37", "愛媛県": "38", "高知県": "39", "福岡県": "40", "佐賀県": "41", "長崎県": "42",
  "熊本県": "43", "大分県": "44", "宮崎県": "45", "鹿児島県": "46", "沖縄県": "47"
};

/**
 * Resolve city name string to MLIT city code (5 digits)
 * E.g: "埼玉県", "深谷市" -> Fetches XIT002?area=11 -> returns 11218
 */
export async function resolveCityCode(prefecture: string, city: string): Promise<{ cityCode: string, cityName: string } | null> {
  const prefCode = PREF_MAP[prefecture];
  if (!prefCode || !city) return null;

  try {
    const response = await fetch(`${BASE_URL}/XIT002?year=2023&area=${prefCode}`, {
       method: "GET",
       headers: { "Ocp-Apim-Subscription-Key": MLIT_API_KEY },
       next: { revalidate: 86400 } // Cache pref list for a day
    });

    if (response.ok) {
       const json = await response.json();
       const cities = json.data || [];
       
       // Clean suffixes to match '白老郡' with '白老町', '福岡市' with '福岡', etc.
       const cleanCity = city.replace(/[市区町村郡]$/, '');
       
       const matched = cities.find((c: any) => {
         const cleanMLIT = c.name.replace(/[市区町村郡]$/, '');
         return c.name === city || cleanMLIT === cleanCity || city.includes(cleanMLIT);
       });
       if (matched) return { cityCode: matched.id, cityName: matched.name };
    }
  } catch (e) {
    console.error("Failed to resolve city code:", e);
  }
  return null;
}
