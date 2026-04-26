import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const digests = await prisma.dailyDigest.findMany({
    orderBy: { publishDate: 'desc' },
    take: 5,
  });
  
  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      property_type: { in: ['戸建て', 'マンション'] },
      mlit_investment_gap: { gte: 15, lte: 50 },
    },
    take: 5,
  });

  return NextResponse.json({
    digests,
    matchingPropertiesCount: properties.length,
    matchingProperties: properties.map(p => p.sale_unit_id)
  });
}
