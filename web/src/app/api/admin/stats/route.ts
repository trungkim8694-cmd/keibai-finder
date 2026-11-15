import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  try {
    const [totalUsers, totalComments, totalProperties, latestProperty] =
      await Promise.all([
        prisma.user.count(),
        prisma.comment.count(),
        prisma.property.count({ where: { status: "ACTIVE" } }),
        prisma.property.findFirst({
          orderBy: { created_at: "desc" },
          select: { created_at: true },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalComments,
        totalProperties,
        lastCrawledAt: latestProperty?.created_at || null,
      },
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
