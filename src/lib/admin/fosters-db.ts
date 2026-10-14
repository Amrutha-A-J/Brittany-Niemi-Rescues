import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type AppForFoster = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  answers: Record<string, string | string[]>;
};

/** Adds an approved foster applicant to the roster, or links them to an existing record with the same email. */
export async function ensureFosterFromApplication(supabase: SupabaseClient, app: AppForFoster) {
  const { data: existing } = await supabase.from("fosters").select("id, application_id").ilike("email", app.email).maybeSingle();
  if (existing) {
    if (!existing.application_id) await supabase.from("fosters").update({ application_id: app.id }).eq("id", existing.id);
    return existing.id as string;
  }
  const canFoster = app.answers.can_foster;
  const { data, error } = await supabase
    .from("fosters")
    .insert({
      application_id: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      city: app.city,
      can_foster: Array.isArray(canFoster) ? canFoster : [],
      notes: typeof app.answers.preferences === "string" ? app.answers.preferences : "",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}
