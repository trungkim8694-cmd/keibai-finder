'use server'

import { prisma } from '@/lib/prisma';

export async function getNearbyAuctionResults(lat: number, lng: number, initialRadiusKm: number = 5) {
  if (!lat || !lng) return [];
  
  console.log(`[getNearbyAuctionResults] Querying DB for Lat: ${lat}, Lng: ${lng}`);

  try {
    let finalResults: any[] = [];

    // Progressive radius search: 5km -> 15km -> 50km
    const radii = [initialRadiusKm, 15, 50];
    
    for (const radiusKm of radii) {
      const results = await prisma.$queryRaw`
        SELECT * FROM (
          SELECT 
            "id", "caseNumber", "address", "lat", "lng", 
            "basePrice", "winningPrice", "bidderCount", "marginRate", "completionDate",
            ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( "lat" ) ) ) ) AS distance
          FROM "AuctionResult"
          WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
        ) AS derivedTable
        WHERE distance < ${radiusKm}
        ORDER BY distance ASC
        LIMIT 10
      `;
      
      const parsedResults = (results as any[]).map(row => ({
        id: row.id,
        caseNumber: row.caseNumber,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        basePrice: row.basePrice ? Number(row.basePrice) : null,
        winningPrice: row.winningPrice ? Number(row.winningPrice) : null,
        bidderCount: row.bidderCount,
        marginRate: row.marginRate,
        completionDate: row.completionDate,
        distance: Number(row.distance)
      }));

      if (parsedResults.length >= 3) {
        finalResults = parsedResults;
        console.log(`[getNearbyAuctionResults] Found ${finalResults.length} real results within ${radiusKm}km.`);
        break; // Found enough data
      } else {
        finalResults = parsedResults; // Keep what we found, but continue expanding
      }
    }

    // Fallback: If still no data or less than 3, generate MOCK DUMMY DATA around the exact location
    if (finalResults.length === 0) {
      console.log(`[getNearbyAuctionResults] No local data within 50km! Generating dummy data for UI testing...`);
      finalResults = [];
      const mockCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 mock items
      for (let i = 0; i < mockCount; i++) {
        // Pseudo-random offset: 1 deg lat = 111km -> 0.01 deg = 1.1km
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
        const distanceKm = Math.sqrt(Math.pow(offsetLat * 111, 2) + Math.pow(offsetLng * 90, 2));
        
        const basePriceMock = 5000000 + Math.floor(Math.random() * 15000000);
        const margin = 5 + Math.floor(Math.random() * 45); // 5% to 50% margin
        const winPriceMock = basePriceMock * (1 + margin / 100);
        
        finalResults.push({
          id: `mock-${i}`,
          caseNumber: `2024(k)999${i}`,
          address: `(MOCK) テスト疑似データ ${i + 1}丁目`,
          lat: lat + offsetLat,
          lng: lng + offsetLng,
          basePrice: basePriceMock,
          winningPrice: winPriceMock,
          bidderCount: Math.floor(Math.random() * 12) + 1,
          marginRate: margin,
          completionDate: new Date(Date.now() - Math.random() * 10000000000), // Sometime in past
          distance: distanceKm
        });
      }
    }

    return finalResults;
  } catch (error) {
    console.error(`[getNearbyAuctionResults] Error:`, error);
    return [];
  }
}

export async function getNearestStations(lat: number, lng: number) {
  if (!lat || !lng) return [];

  console.log(`[getNearestStations] Querying nearby stations for Lat: ${lat}, Lng: ${lng}`);

  try {
    const results = await prisma.$queryRaw`
      SELECT * FROM (
        SELECT 
          "id", "name_ja", "line_name", "lat", "lng",
          ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( "lat" ) ) ) ) AS distance
        FROM "RailwayStation"
        WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
      ) AS stationTable
      ORDER BY distance ASC
      LIMIT 3
    `;
    
    return (results as any[]).map(row => {
      // Distance km * 1000m * 1.25 / 80m/min
      const distanceKm = Number(row.distance);
      const walkTimeMin = Math.ceil((distanceKm * 1000 * 1.25) / 80);
      return {
        id: row.id,
        name_ja: row.name_ja,
        line_name: row.line_name,
        lat: row.lat,
        lng: row.lng,
        distanceKm,
        walkTimeMin
      };
    });
  } catch (error) {
    console.error(`[getNearestStations] Error:`, error);
    return [];
  }
}
