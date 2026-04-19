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
            "basePrice", "winningPrice", "bidderCount", "marginRate", "completionDate", "winnerType",
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
        marginRate: row.marginRate !== null ? Number(row.marginRate) * 100 : null,
        completionDate: row.completionDate,
        winnerType: row.winnerType,
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
