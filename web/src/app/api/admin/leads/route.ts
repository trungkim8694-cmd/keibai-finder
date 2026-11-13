import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const q = (searchParams.get('q') || '').trim();

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { contactValue: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      (prisma as any).agencyLead.findMany({
        where,
        take: 50,
        orderBy: { created_at: 'desc' },
      }),
      (prisma as any).agencyLead.count({ where }),
    ]);

    return NextResponse.json({ leads, total });
  } catch (error: any) {
    console.error('Admin leads GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { leadId, status, partnerNotes } = body;

    const updated = await (prisma as any).agencyLead.update({
      where: { id: leadId },
      data: {
        status: status || undefined,
        partnerNotes: partnerNotes !== undefined ? partnerNotes : undefined,
      },
    });

    revalidatePath('/admin/leads');
    revalidatePath('/dashboard');

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('Admin leads POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
