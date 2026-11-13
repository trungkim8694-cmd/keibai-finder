import { NextRequest, NextResponse } from 'next/server';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { validateApiRequest } from '@/lib/security';
import { point } from '@turf/helpers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

// Helper to convert Lat/Lng to XYZ Tile at specific zoom level
function latLngToTile(lat: number, lng: number, zoom: number) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { z: zoom, x, y };
}

// Haversine distance formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

const rawKey = process.env.MLIT_REINFOLIB_API_KEY || process.env.MLIT_API_KEY || '3cee958080dc40b2854698b6407d4b5a';
const MLIT_API_KEY = rawKey.replace(/["'\\]/g, '').trim();

// Base fetch configuration with 7-day Server Fetch Cache (Revalidate)
async function fetchMLITGeoJSON(layerType: string, z: number, x: number, y: number) {
  if (!MLIT_API_KEY) return null;
  const url = `https://www.reinfolib.mlit.go.jp/ex-api/external/${layerType}?response_format=geojson&z=${z}&x=${x}&y=${y}`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Ocp-Apim-Subscription-Key': MLIT_API_KEY },
      next: { revalidate: 604800 }, // Cache 7 days in Next.js Server Cache Layer
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return { type: 'FeatureCollection', features: [] };
      }
      console.error(`MLIT Fetch non-ok for ${layerType}: status=${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error(`MLIT Fetch exception for ${layerType}:`, error?.message || error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!(await validateApiRequest())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
  }
  const searchParams = request.nextUrl.searchParams;
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400, headers: CORS_HEADERS });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400, headers: CORS_HEADERS });
  }

  const tile = latLngToTile(lat, lng, 15);
  const targetPt = point([lng, lat]);

  // Build safe defaults
  let result = {
    flood: "データ未連携 (API待機中)",
    landslide: "データ未連携 (API待機中)",
    tsunami: "データ未連携 (API待機中)",
    storm_surge: "データ未連携 (API待機中)",
    shelter: "データ未連携 (API待機中)",
    timestamp: new Date().toISOString()
  };

  const resHeaders = new Headers(CORS_HEADERS);
  resHeaders.set('Content-Type', 'application/json');
  // Cache for 24h on CDN/Edge, allow serving stale content for 1 hour while revalidating in background
  resHeaders.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');

  if (!MLIT_API_KEY) {
      return NextResponse.json(result, { status: 200, headers: resHeaders });
  }

  try {
    // Parallel MLIT fetching (Promise.all to optimize latency)
    const [floodData, landslideData, tsunamiData, stormData, shelterData] = await Promise.all([
      fetchMLITGeoJSON('XKT026', tile.z, tile.x, tile.y), // Flood 洪水浸水想定
      fetchMLITGeoJSON('XKT029', tile.z, tile.x, tile.y), // Landslide 土砂災害警戒
      fetchMLITGeoJSON('XKT028', tile.z, tile.x, tile.y), // Tsunami 津波浸水想定
      fetchMLITGeoJSON('XKT027', tile.z, tile.x, tile.y), // Storm Surge 高潮浸水想定
      fetchMLITGeoJSON('XGT001', tile.z, tile.x, tile.y)  // Shelter 指定緊急避難場所
    ]);

    // Default safe status if data retrieved
    result.flood = floodData ? "危険なし (想定区域外)" : "データ未取得 (エリア外)";
    result.landslide = landslideData ? "危険なし (警戒区域外)" : "データ未取得 (エリア外)";
    result.tsunami = tsunamiData ? "危険なし (想定区域外)" : "データ未取得 (エリア外)";
    result.storm_surge = stormData ? "危険なし (想定区域外)" : "データ未取得 (エリア外)";
    result.shelter = shelterData ? "付近1km圏内に指定避難所なし" : "データ未取得 (エリア外)";

    // 1. Flood Inundation Check (洪水浸水想定)
    const floodDepthMap: Record<number | string, string> = {
      1: '0.5m未満',
      2: '0.5m〜3.0m未満',
      3: '3.0m〜5.0m未満',
      4: '5.0m〜10.0m未満',
      5: '10.0m〜20.0m未満',
      6: '20.0m以上',
    };
    if (floodData && floodData.features) {
      for (const f of floodData.features) {
        if (f.geometry && f.geometry.type.includes('Polygon')) {
           if (booleanPointInPolygon(targetPt, f)) {
              const rankVal = f.properties?.A31a_205 || f.properties?.rank || f.properties?.rank_code;
              const depthStr = floodDepthMap[rankVal] || f.properties?.rank_ja || '浸水想定区域内';
              const river = f.properties?.A31a_202 ? `（${f.properties.A31a_202}）` : '';
              result.flood = `浸水想定 ${depthStr}${river}`;
              break;
           }
        }
      }
    }

    // 2. Landslide Alert Area (土砂災害警戒区域)
    const landslideTypeMap: Record<number | string, string> = {
      1: '急傾斜地崩壊',
      2: '土石流',
      3: '地滑り',
    };
    if (landslideData && landslideData.features) {
      for (const f of landslideData.features) {
        if (f.geometry && f.geometry.type.includes('Polygon')) {
           if (booleanPointInPolygon(targetPt, f)) {
              const typeCode = f.properties?.A33_001;
              const levelCode = f.properties?.A33_002;
              const hazardType = landslideTypeMap[typeCode] || '';
              const zoneLevel = levelCode === 2 ? '特別警戒区域 (レッド)' : '警戒区域 (イエロー)';
              result.landslide = hazardType ? `${zoneLevel}・${hazardType}` : (f.properties?.zone_ja || zoneLevel);
              break;
           }
        }
      }
    }

    // 3. Tsunami Inundation (津波浸水想定)
    if (tsunamiData && tsunamiData.features) {
      for (const f of tsunamiData.features) {
        if (f.geometry && f.geometry.type.includes('Polygon')) {
           if (booleanPointInPolygon(targetPt, f)) {
              const tDepth = f.properties?.A40_003 || f.properties?.depth_ja || f.properties?.rank_ja || '浸水想定区域内';
              result.tsunami = `津波浸水想定 (${tDepth})`;
              break;
           }
        }
      }
    }

    // 4. Storm Surge Inundation (高潮浸水想定)
    if (stormData && stormData.features) {
      for (const f of stormData.features) {
        if (f.geometry && f.geometry.type.includes('Polygon')) {
           if (booleanPointInPolygon(targetPt, f)) {
              const sDepth = f.properties?.A49_003 || f.properties?.rank_ja || '高潮浸水想定区域内';
              result.storm_surge = `高潮浸水想定 (${sDepth})`;
              break;
           }
        }
      }
    }

    // 5. Nearest Shelter (指定緊急避難場所)
    if (shelterData && shelterData.features) {
       let minDistance = Infinity;
       let bestShelterName = null;
       
       for (const f of shelterData.features) {
          if (f.geometry && f.geometry.type === 'Point') {
             const sLng = f.geometry.coordinates[0];
             const sLat = f.geometry.coordinates[1];
             const d = getDistanceFromLatLonInKm(lat, lng, sLat, sLng);
             if (d < minDistance) {
                minDistance = d;
                bestShelterName = f.properties?.facility_name_ja || f.properties?.name || f.properties?.施設名称 || "指定避難所";
             }
          }
       }

       if (bestShelterName && minDistance < 15) {
           const walkTimeMins = Math.ceil((minDistance * 1000) / 80);
           const distText = minDistance < 1 ? `${Math.round(minDistance * 1000)}m` : `${minDistance.toFixed(1)}km`;
           result.shelter = `${bestShelterName} (約${distText}・徒歩${walkTimeMins}分)`;
       }
    }

    return NextResponse.json(result, {
      status: 200,
      headers: resHeaders,
    });
  } catch (error) {
    console.error('Hazard Check API Error:', error);
    return NextResponse.json({ 
        flood: "データ取得エラー",
        landslide: "データ取得エラー",
        tsunami: "データ取得エラー",
        storm_surge: "データ取得エラー",
        shelter: "データ取得エラー"
    }, { status: 500, headers: CORS_HEADERS });
  }
}
