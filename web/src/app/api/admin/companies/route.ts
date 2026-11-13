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
    const q = (searchParams.get('q') || '').trim();
    const prefecture = searchParams.get('prefecture') || '';
    const verifiedOnly = searchParams.get('verified') === 'true';

    const where: any = {};
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
        take: 50,
        orderBy: [{ isVerified: 'desc' }, { updated_at: 'desc' }],
      }),
      prisma.realEstateCompany.count({ where }),
    ]);

    return NextResponse.json({ companies, total });
  } catch (error: any) {
    console.error('Admin companies GET error:', error);
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
      const updated = await prisma.realEstateCompany.update({
        where: { id: companyId },
        data: {
          specialties: data.specialties,
          description: data.description,
          phone: data.phone,
          email: data.email,
          website: data.website,
        },
      });
      revalidatePath('/admin/companies');
      revalidatePath('/agencies');
      return NextResponse.json({ success: true, company: updated });
    }

    return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin companies POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
