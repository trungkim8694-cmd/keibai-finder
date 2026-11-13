import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, claimId, delistId, reason } = body;

    // 1. Approve Claim Request
    if (action === 'approve_claim' && claimId) {
      const claim = await prisma.companyClaimRequest.findUnique({
        where: { id: claimId },
        include: { company: true },
      });

      if (!claim) {
        return NextResponse.json({ error: '申請データが見つかりません' }, { status: 404 });
      }

      // Find user if applicant email has an account
      const user = await prisma.user.findUnique({
        where: { email: claim.applicantEmail.toLowerCase().trim() },
      });

      // Update Company
      await prisma.realEstateCompany.update({
        where: { id: claim.companyId },
        data: {
          isVerified: true,
          isClaimed: true,
          claimedUserId: user ? user.id : claim.userId || null,
        },
      });

      // Update Claim Request
      const updatedClaim = await prisma.companyClaimRequest.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      revalidatePath('/admin/claims');
      revalidatePath('/admin');
      revalidatePath('/agencies');
      revalidatePath('/dashboard');

      return NextResponse.json({
        success: true,
        claim: JSON.parse(JSON.stringify(updatedClaim)),
      });
    }

    // 2. Reject Claim Request
    if (action === 'reject_claim' && claimId) {
      const updatedClaim = await prisma.companyClaimRequest.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason || '書類不鮮明または本人確認が取れなかったため却下されました。',
          reviewedAt: new Date(),
        },
      });

      revalidatePath('/admin/claims');
      revalidatePath('/admin');
      revalidatePath('/dashboard');

      return NextResponse.json({
        success: true,
        claim: JSON.parse(JSON.stringify(updatedClaim)),
      });
    }

    // 3. Approve Delist Request
    if (action === 'approve_delist' && delistId) {
      const delist = await prisma.companyDelistRequest.findUnique({
        where: { id: delistId },
      });

      if (!delist) {
        return NextResponse.json({ error: '削除申請データが見つかりません' }, { status: 404 });
      }

      await prisma.realEstateCompany.update({
        where: { id: delist.companyId },
        data: { status: 'DELISTED' },
      });

      await prisma.companyDelistRequest.update({
        where: { id: delistId },
        data: { status: 'PROCESSED' },
      });

      revalidatePath('/admin/claims');
      revalidatePath('/admin');
      revalidatePath('/agencies');

      return NextResponse.json({ success: true });
    }

    // 4. Reject Delist Request
    if (action === 'reject_delist' && delistId) {
      await prisma.companyDelistRequest.update({
        where: { id: delistId },
        data: { status: 'REJECTED' },
      });

      revalidatePath('/admin/claims');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin claims action error:', error);
    return NextResponse.json({ error: error.message || '内部エラー' }, { status: 500 });
  }
}
