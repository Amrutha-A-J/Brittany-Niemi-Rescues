import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin/auth-cookie";
import { isDemo } from "@/lib/demo/config";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * Sends www.bnrescues.com to bnrescues.com, and visitors without a login cookie
 * to the login page. Whether the cookie is still valid is checked against the
 * database by each admin page (requireStaff).
 */
export async function proxy(request: NextRequest) {
  if (isDemo) return NextResponse.next();
  const url = request.nextUrl.clone();

  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  const path = url.pathname;
  if (path.startsWith("/admin") && !request.cookies.has(SESSION_COOKIE) && !PUBLIC_ADMIN_PATHS.includes(path)) {
    url.pathname = "/admin/login";
    url.search = path === "/admin" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except static files and photos, which never need either check.
  matcher: ["/((?!_next/|photos/|icon\\.svg|favicon\\.ico).*)"],
};
