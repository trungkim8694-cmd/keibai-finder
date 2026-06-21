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
  const status = searchParams.get("status") || "all";

  try {
    const whereClause: any = {};

    // Apply search filter if present
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
            ]
          }
        }
      ];
    }

    // Apply status filter
    if (status === "verified") {
      whereClause.isVerified = true;
    } else if (status === "unverified") {
      whereClause.isVerified = false;
    }

    const agencies = await prisma.agencyProfile.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        _count: {
          select: {
            reviews: true,
            reports: true,
          }
        }
      }
    });

    return NextResponse.json({ agencies });
  } catch (error) {
    console.error("Admin agencies GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { agencyId, isVerified, rejectionReason } = await request.json();

    if (!agencyId || typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    const dataToUpdate: any = { isVerified };
    if (isVerified) {
      dataToUpdate.rejectionReason = null;
    } else if (rejectionReason !== undefined) {
      dataToUpdate.rejectionReason = rejectionReason;
    }

    const updatedAgency = await prisma.agencyProfile.update({
      where: { id: agencyId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      agency: updatedAgency, 
      message: `Agency ${updatedAgency.companyName} verification status updated to ${isVerified}` 
    });
  } catch (error) {
    console.error("Admin agency PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { agencyId } = await request.json();

    if (!agencyId) {
      return NextResponse.json({ error: "Missing agencyId" }, { status: 400 });
    }

    // Find agency to get the associated userId
    const agency = await prisma.agencyProfile.findUnique({
      where: { id: agencyId },
      select: { userId: true, companyName: true }
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Revert user role to USER
    await prisma.user.update({
      where: { id: agency.userId },
      data: { role: "USER" }
    });

    // Delete the agency profile
    await prisma.agencyProfile.delete({
      where: { id: agencyId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Agency profile for ${agency.companyName} deleted successfully. User role reset to USER.`
    });
  } catch (error) {
    console.error("Admin agency DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
