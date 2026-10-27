"use server";

import { batch } from "@/lib/db";
import type { SettingKey } from "@/lib/settings";
import type { FormState } from "./auth-actions";
import { assertStaff } from "./session";

/** A Google Maps link without the tracking junk a shared pin carries (keeps just `?q=`). */
function cleanMapUrl(raw: string) {
  try {
    const url = new URL(raw);
    const q = url.searchParams.get("q");
    return /google\./.test(url.hostname) && q ? `https://www.google.com/maps?q=${encodeURIComponent(q).replace(/%2C/g, ",")}` : url.toString();
  } catch {
    return raw;
  }
}

/** Saves whichever settings the form includes (Admin → Account has one form per card). */
export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertStaff();
  const values: Partial<Record<SettingKey, string>> = {};
  const field = (name: string) => (formData.has(name) ? String(formData.get(name) ?? "").trim() : undefined);

  const notifyEmail = field("notify_email");
  if (notifyEmail !== undefined) {
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) return { error: "Enter a valid email address." };
    values.notifyEmail = notifyEmail;
  }
  const meetLocation = field("meet_location");
  if (meetLocation !== undefined) values.meetLocation = meetLocation;
  const meetMapUrl = field("meet_map_url");
  if (meetMapUrl !== undefined) {
    if (meetMapUrl && !/^https?:\/\//.test(meetMapUrl)) return { error: "The map link should start with https://" };
    values.meetMapUrl = meetMapUrl && cleanMapUrl(meetMapUrl);
  }

  const now = new Date().toISOString();
  await batch(
    Object.entries(values).map(([key, value]) => [
      `insert into settings (key, value, updated_at) values (?, ?, ?)
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      key,
      value,
      now,
    ]),
  );
  return { ok: true, message: "Saved." };
}
