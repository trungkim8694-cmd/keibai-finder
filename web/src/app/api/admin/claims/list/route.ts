import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession, parsePagination } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, 50, 100);

    const [claims, delists, totalClaims, totalDelists] = await Promise.all([
      prisma.companyClaimRequest.findMany({
        include: { company: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyDelistRequest.findMany({
        include: { company: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyClaimRequest.count(),
      prisma.companyDelistRequest.count(),
    ]);

    return NextResponse.json({
      claims,
      delists,
      totalClaims,
      totalDelists,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error('List claims error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラー' },
      { status: 500 }
    );
  }
}
