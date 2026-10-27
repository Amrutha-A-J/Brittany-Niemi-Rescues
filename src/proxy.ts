import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin/auth-cookie";
import { isDemo } from "@/lib/demo/config";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * Sends visitors without a login cookie to the login page. Whether the cookie is
 * still valid is checked against the database by each admin page (requireStaff).
 */
export async function proxy(request: NextRequest) {
  if (isDemo) return NextResponse.next();
  const path = request.nextUrl.pathname;
  if (!request.cookies.has(SESSION_COOKIE) && !PUBLIC_ADMIN_PATHS.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = path === "/admin" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
