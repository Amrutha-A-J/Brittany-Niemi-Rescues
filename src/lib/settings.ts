import "server-only";
import { all } from "./db";

// Read on each call: on Cloudflare, settings reach process.env per request, not at module load.
const defaults = () => ({
  /** Where "new application" and "meet & greet booked" emails go. */
  notifyEmail: process.env.RESCUE_NOTIFY_EMAIL || process.env.EMAIL_FROM || "",
  /** Pre-filled "Where" for a new meet & greet, e.g. "Brittany's home, north Regina". */
  meetLocation: "",
  /** Pre-filled map link for a new meet & greet (a Google Maps pin). */
  meetMapUrl: "",
});

export type Settings = ReturnType<typeof defaults>;
export type SettingKey = keyof Settings;

/** Admin settings (Admin → Account). Missing or blank values use the defaults above. */
export async function getSettings(): Promise<Settings> {
  const settings = defaults();
  try {
    const rows = await all<{ key: string; value: string }>("select key, value from settings");
    for (const r of rows) if (r.key in settings && r.value.trim()) settings[r.key as SettingKey] = r.value.trim();
  } catch (err) {
    // Until migration 0005 has run, the table doesn't exist.
    console.error("[settings] using defaults", err);
  }
  return settings;
}
