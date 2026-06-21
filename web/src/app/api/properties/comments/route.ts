import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sale_unit_id, content } = await request.json();

    if (!sale_unit_id || !content || content.trim() === "") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        sale_unit_id,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ comment: newComment, message: "Comment created successfully" });
  } catch (error) {
    console.error("Post comment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
