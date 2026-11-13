import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ companies: [] });
    }

    const companies = await prisma.realEstateCompany.findMany({
      where: {
        AND: [
          { status: { not: 'DELISTED' } },
          {
            OR: [
              { companyName: { contains: q, mode: 'insensitive' } },
              { licenseNumber: { contains: q, mode: 'insensitive' } },
              { houjinNumber: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
            ]
          }
        ]
      },
      select: {
        id: true,
        companyName: true,
        licenseNumber: true,
        houjinNumber: true,
        prefecture: true,
        city: true,
        address: true,
        phone: true,
        email: true,
        isClaimed: true,
        isVerified: true,
        specialties: true,
        description: true,
      },
      take: 10,
      orderBy: [
        { isVerified: 'desc' },
        { companyName: 'asc' }
      ]
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Company search error:', error);
    return NextResponse.json({ error: '検索に失敗しました' }, { status: 500 });
  }
}
