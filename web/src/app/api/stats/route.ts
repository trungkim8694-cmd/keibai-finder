import { NextResponse } from 'next/server';
import { getFacetedStats, SearchFilters } from '@/actions/propertyActions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {};

    const keyword = searchParams.get('keyword');
    if (keyword) filters.keyword = keyword;

    const types = searchParams.getAll('types[]');
    if (types && types.length > 0) filters.types = types;

    const provider = searchParams.get('provider');
    if (provider) filters.provider = provider;

    const providers = searchParams.getAll('providers[]');
    if (providers && providers.length > 0) filters.providers = providers;

    const courtName = searchParams.get('courtName');
    if (courtName) filters.courtName = courtName;

    const managingAuthority = searchParams.get('managingAuthority');
    if (managingAuthority) filters.managingAuthority = managingAuthority;

    const lineName = searchParams.get('lineName');
    if (lineName) filters.lineName = lineName;

    const stationName = searchParams.get('stationName');
    if (stationName) filters.stationName = stationName;

    const minPrice = searchParams.get('minPrice');
    if (minPrice) filters.minPrice = parseInt(minPrice);

    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);

    const isClosingSoon = searchParams.get('isClosingSoon');
    if (isClosingSoon === 'true') filters.isClosingSoon = true;

    const prefectures = searchParams.getAll('prefectures[]');
    if (prefectures && prefectures.length > 0) filters.prefectures = prefectures;

    const minArea = searchParams.get('minArea');
    if (minArea) filters.minArea = parseInt(minArea);

    const swLat = searchParams.get('swLat');
    const swLng = searchParams.get('swLng');
    const neLat = searchParams.get('neLat');
    const neLng = searchParams.get('neLng');
    if (swLat && swLng && neLat && neLng) {
        filters.bounds = {
            sw: { lat: parseFloat(swLat), lng: parseFloat(swLng) },
            ne: { lat: parseFloat(neLat), lng: parseFloat(neLng) }
        };
    }

    const data = await getFacetedStats(filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
