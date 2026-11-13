import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [claims, delists] = await Promise.all([
      prisma.companyClaimRequest.findMany({
        include: { company: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.companyDelistRequest.findMany({
        include: { company: true },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return NextResponse.json({ claims, delists });
  } catch (error: any) {
    console.error('List claims error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
