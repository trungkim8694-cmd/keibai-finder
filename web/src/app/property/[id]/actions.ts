'use server'

import { prisma } from '@/lib/prisma';

export async function getNearbyAuctionResults(lat: number, lng: number, radiusKm: number = 20) {
  if (!lat || !lng) return [];
  
  try {
    const results = await prisma.$queryRaw`
      SELECT * FROM (
        SELECT 
          "id", "caseNumber", "address", "lat", "lng", 
          "basePrice", "winningPrice", "bidderCount", "marginRate", "completionDate", "winnerType", "raw_data",
          ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( "lat" ) ) * cos( radians( "lng" ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( "lat" ) ) ) ) AS distance
        FROM "AuctionResult"
        WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
      ) AS derivedTable
      WHERE distance <= ${radiusKm}
      ORDER BY distance ASC
      LIMIT 15
    `;
    
    const parsedResults = (results as any[]).map(row => {
      const raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data || '{}') : (row.raw_data || {});
      const station = raw.nearest_station;
      const grp = raw.grp;
      const fallbackAddr = station ? `${station}駅周辺` : (grp ? `${grp}物件` : '近隣エリア');
      
      let margin = null;
      if (row.marginRate !== null && row.marginRate !== undefined) {
        const num = Number(row.marginRate);
        margin = Math.abs(num) <= 5 ? Math.round(num * 100 * 10) / 10 : Math.round(num * 10) / 10;
      }

      return {
        id: row.id,
        caseNumber: row.caseNumber,
        address: row.address || fallbackAddr,
        lat: row.lat,
        lng: row.lng,
        basePrice: row.basePrice ? Number(row.basePrice) : null,
        winningPrice: row.winningPrice ? Number(row.winningPrice) : null,
        bidderCount: row.bidderCount,
        marginRate: margin,
        completionDate: row.completionDate,
        winnerType: row.winnerType,
        distance: Number(row.distance),
        sqm: raw.sqm || null,
        age: raw.age || null,
        grp: raw.grp || null,
        endYear: raw.end_year || (row.completionDate ? new Date(row.completionDate).getFullYear() : null)
      };
    });

    return parsedResults;
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
