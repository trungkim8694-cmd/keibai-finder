import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalComments = await prisma.comment.count();
    const totalProperties = await prisma.property.count({ where: { status: 'ACTIVE' } });
    
    const latestProperty = await prisma.property.findFirst({
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalComments,
        totalProperties,
        lastCrawledAt: latestProperty?.created_at || null
      }
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
