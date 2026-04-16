import { prisma } from './prisma';

const MLIT_API_KEY = process.env.MLIT_API_KEY || "3cee958080dc40b2854698b6407d4b5a"; // Fallback to provided key
const BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external";

export type MlitTransaction = {
  TradePrice: string;
  PricePerUnit?: string;
  UnitPrice?: string;
  Area?: string;
  BuildingYear?: string;
  Period?: string;
  Type?: string;
  Municipality?: string;
  DistrictName?: string;
};

/**
 * MLIT Property Types Mapping
 * - "戸建て" (House) -> 宅地(土地と建物) (Land and Building)
 * - "マンション" (Mansion) -> 中古マンション等 (Used Mansion)
 * - "土地" (Land) -> 宅地(土地) (Land) or 林地 / 農地
 */
export function mapPropertyTypeToMlit(keibaiType: string): string[] {
  if (keibaiType === '戸建て') return ['宅地(土地と建物)'];
  if (keibaiType === 'マンション') return ['中古マンション等'];
  if (keibaiType === '土地') return ['宅地(土地)'];
  return ['宅地(土地と建物)', '中古マンション等', '宅地(土地)'];
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
 * It aggregates all transactions for a predefined timeframe (e.g. 2023) and specific types.
 */
export async function getMarketValuation(cityCode: string, propertyType: string, year: string = '2023') {
  if (!cityCode) return null;

  const mlitTypes = mapPropertyTypeToMlit(propertyType);
  const searchType = mlitTypes[0]; // Primary type for cache key
  
  // 1. Check Database Cache
  const cached = await prisma.mlitMarketCache.findUnique({
    where: {
      municipalityCode_propertyType_year: {
         municipalityCode: cityCode,
         propertyType: searchType,
         year: year
      }
    }
  });

  // Return if valid cache (fetched within 30 days)
  if (cached && (new Date().getTime() - cached.last_fetched_at.getTime() < 30 * 24 * 60 * 60 * 1000)) {
     return {
        avgTradePrice: cached.avgTradePrice ? Number(cached.avgTradePrice) : null,
        avgArea: cached.avgArea || null,
        avgPricePerSqm: cached.avgPricePerSqm ? Number(cached.avgPricePerSqm) : null,
        transactions: cached.transactions as MlitTransaction[] | null
     };
  }

  // 2. Not in cache or expired. Fetch from MLIT
  const allTrans = await fetchMlitApiData(cityCode, year);
  
  // 3. Filter transactions matching the requested property type
  const matchedTrans = allTrans.filter(t => t.Type && mlitTypes.includes(t.Type));
  
  // 4. Calculate Average Trade Price, Average Area, and Price Per Sqm
  let avgTradePrice: number | null = null;
  let avgArea: number | null = null;
  let avgPricePerSqm: number | null = null;
  
  if (matchedTrans.length > 0) {
     const total = matchedTrans.reduce((sum, t) => sum + (Number(t.TradePrice) || 0), 0);
     avgTradePrice = Math.round(total / matchedTrans.length);
     
     // Calculate area stats (filter out rows where Area is unparseable or 0)
     const transWithArea = matchedTrans.map(t => {
       const areaNum = Number(t.Area?.replace(/[^0-9.]/g, ''));
       return { ...t, parsedArea: isNaN(areaNum) || areaNum === 0 ? null : areaNum };
     }).filter(t => t.parsedArea !== null);

     if (transWithArea.length > 0) {
        const totalArea = transWithArea.reduce((sum, t) => sum + t.parsedArea!, 0);
        avgArea = totalArea / transWithArea.length;
        // Total price of properties that have valid areas / Total area
        const totalPriceWithArea = transWithArea.reduce((sum, t) => sum + (Number(t.TradePrice) || 0), 0);
        avgPricePerSqm = Math.round(totalPriceWithArea / totalArea);
     }
  }

  // We only store the latest 100 transactions to save DB space
  const recentTrans = matchedTrans.slice(0, 100);

  // 5. Save back to DB Cache
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
           avgTradePrice: avgTradePrice,
           avgArea: avgArea,
           avgPricePerSqm: avgPricePerSqm,
           transactions: recentTrans,
           last_fetched_at: new Date()
        },
        create: {
           municipalityCode: cityCode,
           propertyType: searchType,
           year: year,
           avgTradePrice: avgTradePrice,
           avgArea: avgArea,
           avgPricePerSqm: avgPricePerSqm,
           transactions: recentTrans
        }
     });
  } catch (dbError) {
     console.error("Failed to save MLIT Cache:", dbError);
  }

  return {
    avgTradePrice,
    avgArea,
    avgPricePerSqm,
    transactions: recentTrans
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
export async function resolveCityCode(prefecture: string, city: string): Promise<string | null> {
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
       if (matched) return matched.id;
    }
  } catch (e) {
    console.error("Failed to resolve city code:", e);
  }
  return null;
}
