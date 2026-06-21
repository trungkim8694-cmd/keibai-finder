import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isBanned: true,
        adminNotes: true,
        created_at: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, role, isBanned, adminNotes } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot modify your own profile" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (role !== undefined) {
      if (role !== "USER" && role !== "ADMIN" && role !== "AGENCY") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      dataToUpdate.role = role;
    }
    if (isBanned !== undefined) {
      dataToUpdate.isBanned = isBanned;
    }
    if (adminNotes !== undefined) {
      dataToUpdate.adminNotes = adminNotes;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        adminNotes: true
      }
    });

    return NextResponse.json({ user: updatedUser, message: "User updated successfully" });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    // Cascade deletes handle comments/favorites/etc
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
