"use server";

import { run } from "@/lib/db";
import type { FormState } from "./auth-actions";
import { assertStaff } from "./session";

export async function saveNotifyEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertStaff();
  const email = String(formData.get("notify_email") ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  await run(
    `insert into settings (key, value, updated_at) values ('notifyEmail', ?, ?)
     on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
    email,
    new Date().toISOString(),
  );
  return { ok: true, message: "Saved. New applications and meet & greets will be emailed there." };
}
