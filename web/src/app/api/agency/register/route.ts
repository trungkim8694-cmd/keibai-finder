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
    const { companyName, licenseNumber, phone, fax, email, website, prefectures, description, logoUrl, licenseImageUrl } = body;

    if (!companyName || !licenseNumber || !phone || !prefectures || !Array.isArray(prefectures) || prefectures.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    // Check existing profile
    const existing = await prisma.agencyProfile.findUnique({
      where: { userId }
    });

    let nextVerified = false;
    let nextRejectionReason: string | null = null;
    if (existing) {
      // If license details changed, reset isVerified to false and clear rejection reason
      if (existing.licenseNumber !== licenseNumber || existing.licenseImageUrl !== licenseImageUrl) {
        nextVerified = false;
        nextRejectionReason = null;
      } else {
        nextVerified = existing.isVerified;
        nextRejectionReason = existing.rejectionReason;
      }
    }

    // Upsert AgencyProfile
    const profile = await prisma.agencyProfile.upsert({
      where: { userId },
      update: {
        companyName,
        licenseNumber,
        phone,
        fax: fax || null,
        email: email || null,
        website: website || null,
        prefectures,
        description: description || null,
        logoUrl: logoUrl || null,
        licenseImageUrl: licenseImageUrl || null,
        isVerified: nextVerified,
        rejectionReason: nextRejectionReason,
      },
      create: {
        userId,
        companyName,
        licenseNumber,
        phone,
        fax: fax || null,
        email: email || null,
        website: website || null,
        prefectures,
        description: description || null,
        logoUrl: logoUrl || null,
        licenseImageUrl: licenseImageUrl || null,
        isVerified: false, // New registration starts as unverified
        rejectionReason: null,
      },
    });

    // Update User Role to AGENCY
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'AGENCY' },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Agency registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
