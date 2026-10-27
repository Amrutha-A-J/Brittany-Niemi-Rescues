import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { currentUser } from "./auth";

/** Returns the logged-in staff member, or redirects to login. */
export const requireStaff = cache(async () => {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return { user };
});

/** For server actions and routes: throws instead of redirecting if the caller isn't logged in. */
export async function assertStaff() {
  const user = await currentUser();
  if (!user) throw new Error("Not authorised");
  return user;
}

export function safeNext(next: unknown, fallback = "/admin") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
