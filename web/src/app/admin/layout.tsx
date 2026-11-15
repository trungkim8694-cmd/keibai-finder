import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminShellClient from "./AdminShellClient";

export const dynamic = 'force-dynamic';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as { role?: string } | undefined)?.role !== "ADMIN") {
    redirect("/");
  }

  const [pendingClaimsCount, pendingDelistsCount] = await Promise.all([
    prisma.companyClaimRequest.count({ where: { status: 'PENDING' } }),
    prisma.companyDelistRequest.count({ where: { status: 'PENDING' } }),
  ]);
  const totalPendingReviews = pendingClaimsCount + pendingDelistsCount;

  return (
    <AdminShellClient
      adminEmail={session.user?.email || "Admin"}
      totalPendingReviews={totalPendingReviews}
    >
      {children}
    </AdminShellClient>
  );
}
