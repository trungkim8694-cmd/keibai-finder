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
    const comments = await prisma.comment.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Fetch matching properties manually to join in memory
    const saleUnitIds = Array.from(new Set(comments.map(c => c.sale_unit_id)));
    const properties = await prisma.property.findMany({
      where: { sale_unit_id: { in: saleUnitIds } },
      select: {
        sale_unit_id: true,
        address: true,
        property_type: true,
        court_name: true
      }
    });

    const propertyMap = new Map(properties.map(p => [p.sale_unit_id, p]));

    const joinedComments = comments.map(c => ({
      ...c,
      property: propertyMap.get(c.sale_unit_id) || {
        sale_unit_id: c.sale_unit_id,
        address: "Không rõ địa chỉ",
        property_type: "Bất động sản",
        court_name: "Không rõ"
      }
    }));

    return NextResponse.json({ comments: joinedComments });
  } catch (error) {
    console.error("Admin comments API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("id");

  if (!commentId) {
    return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
  }

  try {
    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Admin delete comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
