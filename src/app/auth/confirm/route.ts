import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { consumeResetToken, startSession } from "@/lib/admin/auth";

/** Landing point for the link in password reset emails. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const staffId = token ? await consumeResetToken(token) : null;
  if (!staffId) redirect("/admin/login?error=link");
  await startSession(staffId);
  redirect("/admin/reset-password");
}
