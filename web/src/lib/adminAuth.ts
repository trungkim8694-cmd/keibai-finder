import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, errorResponse: null };
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 50,
  maxLimit = 100
) {
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defaultLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function isPrismaNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2025"
  );
}

export function getProtectedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
