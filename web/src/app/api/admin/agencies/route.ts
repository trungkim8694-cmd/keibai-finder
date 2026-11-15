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
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || "all";
  const { page, limit, skip } = parsePagination(searchParams, 50, 100);

  try {
    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (status === "verified") {
      whereClause.isVerified = true;
    } else if (status === "unverified") {
      whereClause.isVerified = false;
    }

    const [agencies, total] = await Promise.all([
      prisma.agencyProfile.findMany({
        where: whereClause,
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
              role: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              reports: true,
            },
          },
        },
      }),
      prisma.agencyProfile.count({ where: whereClause }),
    ]);

    return NextResponse.json({ agencies, total, page, limit });
  } catch (error) {
    console.error("Admin agencies GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  try {
    const { agencyId, isVerified, rejectionReason } = await request.json();

    if (!agencyId || typeof isVerified !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { isVerified };
    if (isVerified) {
      dataToUpdate.rejectionReason = null;
    } else if (rejectionReason !== undefined) {
      dataToUpdate.rejectionReason =
        typeof rejectionReason === "string" ? rejectionReason.trim() : null;
    }

    const updatedAgency = await prisma.agencyProfile.update({
      where: { id: agencyId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      agency: updatedAgency,
      message: `Agency ${updatedAgency.companyName} verification status updated to ${isVerified}`,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }
    console.error("Admin agency PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  try {
    const { agencyId } = await request.json();

    if (!agencyId) {
      return NextResponse.json({ error: "Missing agencyId" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agencyProfile.findUnique({
        where: { id: agencyId },
        select: {
          userId: true,
          companyName: true,
          user: { select: { role: true } },
        },
      });

      if (!agency) {
        return null;
      }

      // Only reset AGENCY users back to USER; never demote an ADMIN
      if (agency.user.role === "AGENCY") {
        await tx.user.update({
          where: { id: agency.userId },
          data: { role: "USER" },
        });
      }

      await tx.agencyProfile.delete({
        where: { id: agencyId },
      });

      return agency;
    });

    if (!result) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Agency profile for ${result.companyName} deleted successfully.`,
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }
    console.error("Admin agency DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
