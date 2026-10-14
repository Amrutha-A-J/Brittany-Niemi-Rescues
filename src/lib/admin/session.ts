import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Returns a Supabase client acting as the logged-in staff member, or redirects to login. */
export const requireStaff = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", user.id).maybeSingle();
  return { supabase, user, isStaff: Boolean(staff) };
});

/** For server actions: throws instead of rendering if the caller isn't staff. */
export async function staffClient() {
  const { supabase, isStaff } = await requireStaff();
  if (!isStaff) throw new Error("Not authorised");
  return supabase;
}

export function safeNext(next: unknown, fallback = "/admin") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
