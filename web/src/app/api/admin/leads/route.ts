import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  requireAdminSession,
  parsePagination,
  isPrismaNotFoundError,
} from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const VALID_LEAD_STATUSES = [
  'NEW',
  'DISPATCHED',
  'CONTACTED',
  'IN_CONSULTATION',
  'WON',
  'CLOSED',
  'CANCELLED',
] as const;

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const q = (searchParams.get('q') || '').trim();
    const { page, limit, skip } = parsePagination(searchParams, 50, 100);

    const where: Record<string, unknown> = {};
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
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      (prisma as any).agencyLead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, limit });
  } catch (error: unknown) {
    console.error('Admin leads GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラー' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { leadId, status, partnerNotes } = body;

    if (!leadId || typeof leadId !== 'string') {
      return NextResponse.json({ error: 'leadId は必須です' }, { status: 400 });
    }

    if (
      status !== undefined &&
      !VALID_LEAD_STATUSES.includes(status as (typeof VALID_LEAD_STATUSES)[number])
    ) {
      return NextResponse.json({ error: '不正なステータスです' }, { status: 400 });
    }

    const updated = await (prisma as any).agencyLead.update({
      where: { id: leadId },
      data: {
        status: status || undefined,
        partnerNotes:
          partnerNotes !== undefined
            ? typeof partnerNotes === 'string'
              ? partnerNotes.trim()
              : null
            : undefined,
      },
    });

    revalidatePath('/admin/leads');
    revalidatePath('/dashboard');

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: unknown) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json(
        { error: 'リードが見つかりません' },
        { status: 404 }
      );
    }
    console.error('Admin leads POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラー' },
      { status: 500 }
    );
  }
}
