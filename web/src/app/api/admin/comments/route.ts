import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminSession,
  parsePagination,
  isPrismaNotFoundError,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, 50, 100);

  try {
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.comment.count(),
    ]);

    const saleUnitIds = Array.from(new Set(comments.map((c) => c.sale_unit_id)));
    const properties = saleUnitIds.length
      ? await prisma.property.findMany({
          where: { sale_unit_id: { in: saleUnitIds } },
          select: {
            sale_unit_id: true,
            address: true,
            property_type: true,
            court_name: true,
          },
        })
      : [];

    const propertyMap = new Map(properties.map((p) => [p.sale_unit_id, p]));

    const joinedComments = comments.map((c) => ({
      ...c,
      property: propertyMap.get(c.sale_unit_id) || {
        sale_unit_id: c.sale_unit_id,
        address: "住所不明",
        property_type: "競売物件",
        court_name: "裁判所不明",
      },
    }));

    return NextResponse.json({ comments: joinedComments, total, page, limit });
  } catch (error) {
    console.error("Admin comments API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("id");

  if (!commentId) {
    return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
  }

  try {
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    console.error("Admin delete comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
