import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  requireAdminSession,
  parsePagination,
  isPrismaNotFoundError,
} from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const prefecture = (searchParams.get('prefecture') || '').trim();
    const verifiedOnly = searchParams.get('verified') === 'true';
    const { page, limit, skip } = parsePagination(searchParams, 50, 100);

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { companyName: { contains: q, mode: 'insensitive' } },
        { licenseNumber: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { houjinNumber: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (prefecture) {
      where.prefecture = prefecture;
    }
    if (verifiedOnly) {
      where.isVerified = true;
    }

    const [companies, total] = await Promise.all([
      prisma.realEstateCompany.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isVerified: 'desc' }, { updated_at: 'desc' }],
      }),
      prisma.realEstateCompany.count({ where }),
    ]);

    return NextResponse.json({ companies, total, page, limit });
  } catch (error: unknown) {
    console.error('Admin companies GET error:', error);
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
    const { action, companyId, isVerified, data } = body;

    if (action === 'toggle_verify' && companyId) {
      const updated = await prisma.realEstateCompany.update({
        where: { id: companyId },
        data: { isVerified: Boolean(isVerified) },
      });
      revalidatePath('/admin/companies');
      revalidatePath('/agencies');
      return NextResponse.json({ success: true, company: updated });
    }

    if (action === 'update_company' && companyId && data) {
      const rawWebsite =
        typeof data.website === 'string' ? data.website.trim() : '';
      if (rawWebsite && !/^https?:\/\//i.test(rawWebsite)) {
        return NextResponse.json(
          { error: 'WebサイトURLは http:// または https:// で始まる必要があります' },
          { status: 400 }
        );
      }

      const rawEmail = typeof data.email === 'string' ? data.email.trim() : '';
      if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      const specialties = Array.isArray(data.specialties)
        ? data.specialties
            .filter((s: unknown): s is string => typeof s === 'string')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined;

      const updated = await prisma.realEstateCompany.update({
        where: { id: companyId },
        data: {
          ...(specialties !== undefined ? { specialties } : {}),
          description:
            typeof data.description === 'string' ? data.description.trim() : null,
          phone: typeof data.phone === 'string' ? data.phone.trim() : null,
          email: rawEmail || null,
          website: rawWebsite || null,
        },
      });
      revalidatePath('/admin/companies');
      revalidatePath('/agencies');
      return NextResponse.json({ success: true, company: updated });
    }

    return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
  } catch (error: unknown) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json(
        { error: '指定された会社が見つかりません' },
        { status: 404 }
      );
    }
    console.error('Admin companies POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラー' },
      { status: 500 }
    );
  }
}
