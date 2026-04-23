import { NextResponse } from 'next/server';
import { getProperties, SearchFilters } from '@/actions/propertyActions';

// Force dynamic is often needed if searchParams are used, but we want it to be cacheable by Cloudflare
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Khôi phục bộ lọc từ URL 
    const filters: SearchFilters = {};
    
    // Map Payload Check
    if (searchParams.get('isMapPayload') === 'true') {
        filters.isMapPayload = true;
    }

    // Pagination
    const page = searchParams.get('page');
    if (page) filters.page = parseInt(page);
    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit);

    // Bounds
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

    // Keyword
    const keyword = searchParams.get('keyword');
    if (keyword) filters.keyword = keyword;

    // Sorting
    const sort = searchParams.get('sort');
    if (sort) filters.sort = sort;
    
    // Types (Array)
    const types = searchParams.getAll('types[]');
    if (types && types.length > 0) filters.types = types;
    else {
        const typeStr = searchParams.get('types'); // fallback
        if (typeStr) filters.types = typeStr.split(',');
    }

    // Other string/number filters
    const prefecture = searchParams.get('prefecture');
    if (prefecture) filters.prefecture = prefecture;

    const minPrice = searchParams.get('minPrice');
    if (minPrice) filters.minPrice = parseInt(minPrice);

    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);

    const newOnly = searchParams.get('newOnly');
    if (newOnly === 'true') filters.newOnly = true;
    
    const isClosingSoon = searchParams.get('isClosingSoon');
    if (isClosingSoon === 'true') filters.isClosingSoon = true;

    // Fetch data via the existing logic
    const data = await getProperties(filters);

    // Chuẩn bị Cache-Control Header
    const headers = new Headers();
    // Cache 24h at CDN edge, allow serving stale content while revalidating
    headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');

    // Return the JSON with headers
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
