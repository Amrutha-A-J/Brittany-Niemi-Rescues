"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "./auth-actions";
import { staffClient } from "./session";

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const dateOrNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function revalidateCat(slug?: string) {
  revalidatePath("/");
  revalidatePath("/adopt");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/cats/${slug}`);
  revalidatePath("/admin", "layout");
}

/** Creates or updates the adoption record and marks the cat as adopted. */
export async function saveAdoption(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await staffClient();
  const catId = text(fd, "cat_id");
  const adopterName = text(fd, "adopter_name");
  if (!adopterName) return { error: "Add the adopter's name." };
  const fee = text(fd, "fee_paid");
  const applicationId = text(fd, "application_id") || null;

  const record = {
    cat_id: catId,
    application_id: applicationId,
    adopted_on: dateOrNull(text(fd, "adopted_on")) ?? new Date().toISOString().slice(0, 10),
    adopter_name: adopterName,
    adopter_email: text(fd, "adopter_email"),
    adopter_phone: text(fd, "adopter_phone"),
    adopter_address: text(fd, "adopter_address"),
    fee_paid: fee === "" ? null : Number(fee),
    microchip_number: text(fd, "microchip_number"),
    follow_up_on: dateOrNull(text(fd, "follow_up_on")),
    notes: text(fd, "notes"),
  };
  const { error } = await supabase.from("adoptions").upsert(record, { onConflict: "cat_id" });
  if (error) return { error: error.message };

  const { data: cat, error: catError } = await supabase
    .from("cats")
    .update({ status: "adopted" })
    .eq("id", catId)
    .select("slug")
    .single();
  if (catError) return { error: catError.message };

  if (applicationId) {
    await supabase
      .from("applications")
      .update({ status: "approved", decided_at: new Date().toISOString() })
      .eq("id", applicationId)
      .neq("status", "approved");
  }

  revalidateCat(cat.slug);
  if (fd.get("redirect") === "1") redirect(`/admin/adopted/${catId}`);
  return { message: "Saved." };
}

/** Undo an adoption: removes the record and lists the cat again. */
export async function returnToAvailable(fd: FormData) {
  const supabase = await staffClient();
  const catId = text(fd, "cat_id");
  await supabase.from("adoptions").delete().eq("cat_id", catId);
  const { data: cat } = await supabase.from("cats").update({ status: "available" }).eq("id", catId).select("slug").single();
  revalidateCat(cat?.slug);
  redirect(`/admin/cats/${catId}`);
}
