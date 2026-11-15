import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminSession,
  parsePagination,
  isPrismaNotFoundError,
  getProtectedAdminEmails,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const { page, limit, skip } = parsePagination(searchParams, 50, 100);

  try {
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isBanned: true,
          adminNotes: true,
          created_at: true,
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse || !session) return errorResponse!;

  try {
    const { userId, role, isBanned, adminNotes } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const currentAdminId = (session.user as { id?: string }).id;
    if (userId === currentAdminId) {
      return NextResponse.json(
        { error: "You cannot modify your own profile" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const protectedEmails = getProtectedAdminEmails();
    const isProtectedAdmin =
      targetUser.email &&
      protectedEmails.includes(targetUser.email.toLowerCase());

    const dataToUpdate: Record<string, unknown> = {};
    if (role !== undefined) {
      if (role !== "USER" && role !== "ADMIN" && role !== "AGENCY") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (isProtectedAdmin && role !== "ADMIN") {
        return NextResponse.json(
          {
            error:
              "システム保護された管理者アカウント(ADMIN_EMAILS)の権限は降格できません",
          },
          { status: 400 }
        );
      }
      dataToUpdate.role = role;
    }
    if (isBanned !== undefined) {
      if (isProtectedAdmin && isBanned === true) {
        return NextResponse.json(
          {
            error:
              "システム保護された管理者アカウント(ADMIN_EMAILS)は停止できません",
          },
          { status: 400 }
        );
      }
      dataToUpdate.isBanned = Boolean(isBanned);
    }
    if (adminNotes !== undefined) {
      dataToUpdate.adminNotes =
        typeof adminNotes === "string" ? adminNotes.trim() : null;
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
        adminNotes: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, errorResponse } = await requireAdminSession();
  if (errorResponse || !session) return errorResponse!;

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const currentAdminId = (session.user as { id?: string }).id;
    if (userId === currentAdminId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const protectedEmails = getProtectedAdminEmails();
    if (
      targetUser.email &&
      protectedEmails.includes(targetUser.email.toLowerCase())
    ) {
      return NextResponse.json(
        {
          error:
            "システム保護された管理者アカウント(ADMIN_EMAILS)は削除できません",
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
