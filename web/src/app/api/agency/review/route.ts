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
    const { agencyProfileId, rating, comment } = body;

    if (!agencyProfileId || typeof rating !== 'number' || rating < 1 || rating > 5 || !comment) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Check if the agency exists
    const agency = await prisma.agencyProfile.findUnique({
      where: { id: agencyProfileId },
    });
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Check if the user is reviewing their own agency profile
    if (agency.userId === userId) {
      return NextResponse.json({ error: 'You cannot review your own agency profile' }, { status: 400 });
    }

    // Check if the user already reviewed this agency
    const existingReview = await prisma.agencyReview.findUnique({
      where: {
        agencyProfileId_userId: {
          agencyProfileId,
          userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'すでにこの会社にクチコミを投稿しています。' }, { status: 400 });
    }

    // Create the review
    const review = await prisma.agencyReview.create({
      data: {
        agencyProfileId,
        userId,
        rating,
        comment,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Agency review error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
