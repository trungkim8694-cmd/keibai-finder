import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "dev-secret-key-keibai-2026-very-secure";

function isAdminToken(token: { role?: unknown; email?: unknown } | null): boolean {
  if (!token) return false;
  if (token.role === "ADMIN") return true;
  if (typeof token.email === "string") {
    const adminEmails = (process.env.ADMIN_EMAILS || "trungkim8694@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.includes(token.email.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  const isAdmin = isAdminToken(token);

  if (pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!token || !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
