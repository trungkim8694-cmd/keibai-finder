import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: true, message: 'Nhận mảng rỗng, không cần đồng bộ' });
    }

    // Prepare array for creation, ignoring if exists using createMany with skipDuplicates
    const dataToInsert = ids.map(id => ({
      userId,
      sale_unit_id: id
    }));

    await prisma.favorite.createMany({
      data: dataToInsert,
      skipDuplicates: true // Prisma feature: ignores records that violate unique compound constraints
    });

    // We should also enforce the maximum 20 items per user limit after this sync
    // Just to ensure they don't jump from 15 to 25. If they do, we can trim the oldest, or just let them stay at 20+ until they delete.
    // For now, retaining the newly synced properties is fine, but let's be strict:
    const finalCount = await prisma.favorite.count({ where: { userId } });
    if (finalCount > 20) {
      // Find oldest ones to delete to keep maximum 20.
      const toDelete = await prisma.favorite.findMany({
        where: { userId },
        orderBy: { created_at: 'asc' }, // Oldest first
        take: finalCount - 20,
        select: { sale_unit_id: true }
      });
      
      if (toDelete.length > 0) {
         await prisma.favorite.deleteMany({
            where: {
               userId,
               sale_unit_id: { in: toDelete.map(t => t.sale_unit_id) }
            }
         });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi Sync Favorites:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
