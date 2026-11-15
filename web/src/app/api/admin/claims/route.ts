import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminSession, isPrismaNotFoundError } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

class ActionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request) {
  try {
    const { errorResponse } = await requireAdminSession();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { action, claimId, delistId, reason } = body;

    // 1. Approve Claim Request (Atomic Transaction)
    if (action === 'approve_claim' && claimId) {
      const updatedClaim = await prisma.$transaction(async (tx) => {
        const claim = await tx.companyClaimRequest.findUnique({
          where: { id: claimId },
        });
        if (!claim) {
          throw new ActionError('申請データが見つかりません', 404);
        }
        if (claim.status !== 'PENDING') {
          throw new ActionError('この申請は既に処理済みです', 409);
        }

        const user = await tx.user.findUnique({
          where: { email: claim.applicantEmail.toLowerCase().trim() },
          select: { id: true },
        });
        const resolvedUserId = user?.id ?? claim.userId ?? null;

        await tx.realEstateCompany.update({
          where: { id: claim.companyId },
          data: {
            isVerified: true,
            isClaimed: true,
            claimedUserId: resolvedUserId,
          },
        });

        return tx.companyClaimRequest.update({
          where: { id: claimId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            userId: resolvedUserId,
          },
        });
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
      const updatedClaim = await prisma.$transaction(async (tx) => {
        const claim = await tx.companyClaimRequest.findUnique({
          where: { id: claimId },
        });
        if (!claim) {
          throw new ActionError('申請データが見つかりません', 404);
        }
        if (claim.status !== 'PENDING') {
          throw new ActionError('この申請は既に処理済みです', 409);
        }
        return tx.companyClaimRequest.update({
          where: { id: claimId },
          data: {
            status: 'REJECTED',
            rejectionReason:
              typeof reason === 'string' && reason.trim()
                ? reason.trim()
                : '書類不鮮明または本人確認が取れなかったため却下されました。',
            reviewedAt: new Date(),
          },
        });
      });

      revalidatePath('/admin/claims');
      revalidatePath('/admin');
      revalidatePath('/dashboard');

      return NextResponse.json({
        success: true,
        claim: JSON.parse(JSON.stringify(updatedClaim)),
      });
    }

    // 3. Approve Delist Request (Atomic Transaction)
    if (action === 'approve_delist' && delistId) {
      await prisma.$transaction(async (tx) => {
        const delist = await tx.companyDelistRequest.findUnique({
          where: { id: delistId },
        });
        if (!delist) {
          throw new ActionError('削除申請データが見つかりません', 404);
        }
        if (delist.status !== 'PENDING') {
          throw new ActionError('この削除申請は既に処理済みです', 409);
        }

        await tx.realEstateCompany.update({
          where: { id: delist.companyId },
          data: { status: 'DELISTED' },
        });

        await tx.companyDelistRequest.update({
          where: { id: delistId },
          data: { status: 'PROCESSED' },
        });
      });

      revalidatePath('/admin/claims');
      revalidatePath('/admin');
      revalidatePath('/agencies');

      return NextResponse.json({ success: true });
    }

    // 4. Reject Delist Request
    if (action === 'reject_delist' && delistId) {
      await prisma.$transaction(async (tx) => {
        const delist = await tx.companyDelistRequest.findUnique({
          where: { id: delistId },
        });
        if (!delist) {
          throw new ActionError('削除申請データが見つかりません', 404);
        }
        if (delist.status !== 'PENDING') {
          throw new ActionError('この削除申請は既に処理済みです', 409);
        }
        await tx.companyDelistRequest.update({
          where: { id: delistId },
          data: { status: 'REJECTED' },
        });
      });

      revalidatePath('/admin/claims');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof ActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: '対象データが見つかりません' }, { status: 404 });
    }
    console.error('Admin claims action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '内部エラー' },
      { status: 500 }
    );
  }
}
