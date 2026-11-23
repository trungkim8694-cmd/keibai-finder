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
  const host = req.headers.get("host") || "";
  if (host === "keibai-koubai.com") {
    const redirectUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://www.keibai-koubai.com");
    return NextResponse.redirect(redirectUrl, 308);
  }

  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
