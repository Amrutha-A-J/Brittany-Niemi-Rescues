import "server-only";
import { first, insertSql, newId, run } from "@/lib/db";

type AppForFoster = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  answers: Record<string, string | string[]>;
};

/** Adds an approved foster applicant to the roster, or links them to an existing record with the same email. */
export async function ensureFosterFromApplication(app: AppForFoster) {
  const existing = await first<{ id: string; application_id: string | null }>(
    "select id, application_id from fosters where lower(email) = lower(?)",
    app.email,
  );
  if (existing) {
    if (!existing.application_id) await run("update fosters set application_id = ? where id = ?", app.id, existing.id);
    return existing.id;
  }
  const canFoster = app.answers.can_foster;
  const id = newId();
  await run(
    ...insertSql("fosters", {
      id,
      application_id: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone,
      city: app.city,
      can_foster: JSON.stringify(Array.isArray(canFoster) ? canFoster : []),
      notes: typeof app.answers.preferences === "string" ? app.answers.preferences : "",
    }),
  );
  return id;
}
