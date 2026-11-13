import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const claimId = searchParams.get('claimId');
    const companyId = searchParams.get('companyId');

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/agencies?error=${encodeURIComponent('無効な確認リンクです。')}`);
    }

    // 1. Find by claimId if available
    let claimRequest: any = null;
    if (claimId) {
      claimRequest = await (prisma as any).companyClaimRequest.findUnique({
        where: { id: claimId },
        include: { company: true },
      });
    } else if (companyId) {
      claimRequest = await (prisma as any).companyClaimRequest.findFirst({
        where: { companyId, status: 'PENDING' },
        orderBy: { created_at: 'desc' },
        include: { company: true },
      });
    }

    let targetCompanyId = companyId;
    let targetCompanyName = '';
    let parsedNotes: any = {};

    if (claimRequest) {
      targetCompanyId = claimRequest.companyId;
      targetCompanyName = claimRequest.company?.companyName || '';

      if (claimRequest.notes) {
        try {
          parsedNotes = JSON.parse(claimRequest.notes);
        } catch {
          // fallback plain text
        }
      }

      // Verify token
      if (parsedNotes.token && parsedNotes.token !== token) {
        return NextResponse.redirect(`${baseUrl}/agencies?error=${encodeURIComponent('トークンの有効期限が切れているか、不一致です。')}`);
      }
    } else {
      // Decode direct token
      try {
        const decoded = Buffer.from(token, 'base64url').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (parsed.companyId) {
          targetCompanyId = parsed.companyId;
        }
        if (parsed.exp && parsed.exp < Date.now()) {
          return NextResponse.redirect(`${baseUrl}/agencies?error=${encodeURIComponent('リンクの有効期限が切れています。')}`);
        }
      } catch {
        // invalid token
      }
    }

    if (!targetCompanyId) {
      return NextResponse.redirect(`${baseUrl}/agencies?error=${encodeURIComponent('対象企業が特定できませんでした。')}`);
    }

    // 2. Fetch company
    const company = await (prisma as any).realEstateCompany.findUnique({
      where: { id: targetCompanyId },
    });

    if (!company) {
      return NextResponse.redirect(`${baseUrl}/agencies?error=${encodeURIComponent('対象企業が見つかりませんでした。')}`);
    }

    targetCompanyName = company.companyName;

    // 3. Update company to Verified and Claimed automatically
    const updateData: any = {
      isClaimed: true,
      isVerified: true,
      status: 'ACTIVE',
    };

    if (parsedNotes.specialties && Array.isArray(parsedNotes.specialties) && parsedNotes.specialties.length > 0) {
      updateData.specialties = parsedNotes.specialties;
    }

    if (parsedNotes.customDescription && parsedNotes.customDescription.trim().length > 0) {
      updateData.description = parsedNotes.customDescription.trim();
    }

    await (prisma as any).realEstateCompany.update({
      where: { id: targetCompanyId },
      data: updateData,
    });

    // 4. Update claim request status to APPROVED
    if (claimRequest) {
      await (prisma as any).companyClaimRequest.update({
        where: { id: claimRequest.id },
        data: { status: 'APPROVED' },
      });
    }

    // 5. Redirect with success parameter
    return NextResponse.redirect(
      `${baseUrl}/agencies?verifiedSuccess=true&companyName=${encodeURIComponent(targetCompanyName)}`
    );
  } catch (error: any) {
    console.error('Error verifying claim token:', error);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/agencies?error=${encodeURIComponent('認証処理中にエラーが発生しました。')}`);
  }
}
