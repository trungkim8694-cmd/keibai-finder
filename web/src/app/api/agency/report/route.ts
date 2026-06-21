import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { agencyProfileId, reason } = body;

    if (!agencyProfileId || !reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Check if the agency exists
    const agency = await prisma.agencyProfile.findUnique({
      where: { id: agencyProfileId },
    });
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Create the report
    const report = await prisma.agencyReport.create({
      data: {
        agencyProfileId,
        userId,
        reason,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Agency report error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
