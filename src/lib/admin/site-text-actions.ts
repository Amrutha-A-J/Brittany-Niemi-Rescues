"use server";

import { revalidatePath } from "next/cache";
import { batch } from "@/lib/db";
import { siteTextKeys } from "@/lib/site-text";
import type { FormState } from "./auth-actions";
import { assertStaff } from "./session";

export async function saveSiteText(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertStaff();
  const now = new Date().toISOString();
  await batch(
    siteTextKeys.map((key) => [
      `insert into site_text (key, value, updated_at) values (?, ?, ?)
       on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`,
      key,
      String(formData.get(key) ?? "").replace(/\r\n/g, "\n").trim(),
      now,
    ]),
  );
  revalidatePath("/");
  return { ok: true, message: "Saved. The home page shows the new text now." };
}
