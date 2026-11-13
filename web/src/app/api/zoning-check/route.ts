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

const rawKey = process.env.MLIT_REINFOLIB_API_KEY || process.env.MLIT_API_KEY || '3cee958080dc40b2854698b6407d4b5a';
const MLIT_API_KEY = rawKey.replace(/["'\\]/g, '').trim();

function latLngToTile(lat: number, lng: number, zoom: number) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { z: zoom, x, y };
}

async function fetchMLITGeoJSON(layerCode: string, z: number, x: number, y: number) {
  if (!MLIT_API_KEY) return null;
  const url = `https://www.reinfolib.mlit.go.jp/ex-api/external/${layerCode}?response_format=geojson&z=${z}&x=${x}&y=${y}`;
  try {
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Ocp-Apim-Subscription-Key': MLIT_API_KEY },
        next: { revalidate: 31536000 } // Cache 1 year (31,536,000s) on Next.js Server cache
    });
    if (!res.ok) {
      if (res.status === 404) {
        return { type: 'FeatureCollection', features: [] };
      }
      return null;
    }
    return await res.json();
  } catch (error) {
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

  if (!latStr || !lngStr) return NextResponse.json({ error: 'Missing coordinates' }, { status: 400, headers: CORS_HEADERS });
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400, headers: CORS_HEADERS });

  const tile = latLngToTile(lat, lng, 15);
  const targetPt = point([lng, lat]);

  let result: any = {
    plan_zone: "都市計画区域外（指定なし）",
    land_use: "用途地域指定なし（未指定）",
    coverage: "--%", 
    far: "--%",
    feature: null
  };

  const resHeaders = new Headers(CORS_HEADERS);
  resHeaders.set('Content-Type', 'application/json');
  // Cache for 7 days on CDN/Edge
  resHeaders.set('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400');

  if (!MLIT_API_KEY) return NextResponse.json(result, { status: 200, headers: resHeaders });

  try {
    const [planData, useData] = await Promise.all([
      fetchMLITGeoJSON('XKT001', tile.z, tile.x, tile.y), // 都市計画区域
      fetchMLITGeoJSON('XKT002', tile.z, tile.x, tile.y)  // 用途地域
    ]);

    // 1. Point in Polygon for City Planning (市街化区域 / 市街化調整区域)
    if (planData && planData.features) {
       for (const f of planData.features) {
         if (f.geometry && f.geometry.type.includes('Polygon')) {
           if (booleanPointInPolygon(targetPt, f)) {
              result.plan_zone = f.properties?.area_classification_ja || f.properties?.zone_ja || f.properties?.A29_004 || "都市計画区域内";
              break;
           }
         }
       }
    }

    // 2. Point in Polygon for Zoning / Land Use (用途地域)
    if (useData && useData.features) {
       for (const f of useData.features) {
         if (f.geometry && f.geometry.type.includes('Polygon')) {
            if (booleanPointInPolygon(targetPt, f)) {
                result.land_use = f.properties?.use_area_ja || f.properties?.A29_005 || f.properties?.name || "用途地域指定あり";
                if (f.properties?.u_building_coverage_ratio_ja) result.coverage = f.properties.u_building_coverage_ratio_ja;
                else if (f.properties?.A29_006) result.coverage = `${f.properties.A29_006}%`;
                
                if (f.properties?.u_floor_area_ratio_ja) result.far = f.properties.u_floor_area_ratio_ja;
                else if (f.properties?.A29_007) result.far = `${f.properties.A29_007}%`;
                
                result.feature = f; // Pass the entire GeoJSON feature for map highlighting
                break;
            }
         }
       }
    }

    return NextResponse.json(result, { status: 200, headers: resHeaders });

  } catch (err) {
    return NextResponse.json({ error: 'Zoning mapping logic error' }, { status: 500, headers: CORS_HEADERS });
  }
}
