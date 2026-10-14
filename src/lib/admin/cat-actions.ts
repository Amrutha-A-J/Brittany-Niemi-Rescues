"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/cats";
import type { CatStatus, Sex, YesNoUnknown } from "@/lib/types";
import { staffClient } from "./session";

export type CatInput = {
  id?: string;
  name: string;
  sex: Sex;
  birth_date: string;
  color: string;
  breed: string;
  status: Exclude<CatStatus, "adopted">;
  special_needs: boolean;
  special_needs_notes: string;
  description: string;
  personality: string[];
  good_with_kids: YesNoUnknown;
  good_with_cats: YesNoUnknown;
  good_with_dogs: YesNoUnknown;
  spayed_neutered: boolean;
  vaccinated: boolean;
  microchipped: boolean;
  adoption_fee: number | null;
  photos: { path: string; alt: string }[];
};

function revalidatePublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/adopt");
  revalidatePath("/apply");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/cats/${slug}`);
}

const yn = (v: unknown): YesNoUnknown => (v === "yes" || v === "no" ? v : "unknown");

export async function saveCat(input: CatInput): Promise<{ error?: string; id?: string }> {
  const supabase = await staffClient();

  const name = input.name.trim();
  if (!name) return { error: "Give the cat a name." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birth_date)) return { error: "Add a birth date (an estimate is fine)." };

  const row = {
    name,
    sex: input.sex === "male" ? "male" : "female",
    birth_date: input.birth_date,
    color: input.color.trim(),
    breed: input.breed.trim(),
    special_needs: Boolean(input.special_needs),
    special_needs_notes: input.special_needs ? input.special_needs_notes.trim() : "",
    description: input.description.trim(),
    personality: input.personality.map((p) => p.trim()).filter(Boolean).slice(0, 12),
    good_with_kids: yn(input.good_with_kids),
    good_with_cats: yn(input.good_with_cats),
    good_with_dogs: yn(input.good_with_dogs),
    spayed_neutered: Boolean(input.spayed_neutered),
    vaccinated: Boolean(input.vaccinated),
    microchipped: Boolean(input.microchipped),
    adoption_fee: input.adoption_fee != null && Number.isFinite(input.adoption_fee) ? Math.round(input.adoption_fee) : null,
  };

  let id = input.id;
  let slug: string;

  if (id) {
    const { data: existing, error: fetchError } = await supabase.from("cats").select("slug, status").eq("id", id).single();
    if (fetchError) return { error: fetchError.message };
    slug = existing.slug;
    // Adopted cats keep their status here; adoption is managed from the Adopted section.
    const status = existing.status === "adopted" ? "adopted" : input.status === "pending" ? "pending" : "available";
    const { error } = await supabase.from("cats").update({ ...row, status }).eq("id", id);
    if (error) return { error: error.message };
  } else {
    // Keep slugs stable and unique: "pickle", "pickle-2", …
    const base = slugify(name) || "cat";
    const { data: taken } = await supabase.from("cats").select("slug").like("slug", `${base}%`);
    const used = new Set((taken ?? []).map((t) => t.slug));
    slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    const { data, error } = await supabase
      .from("cats")
      .insert({ ...row, slug, status: input.status === "pending" ? "pending" : "available" })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id as string;
  }

  // Sync photos: the order in `input.photos` is the display order (first = cover).
  const { data: existingPhotos } = await supabase.from("cat_photos").select("id, path").eq("cat_id", id);
  const keep = new Set(input.photos.map((p) => p.path));
  const removed = (existingPhotos ?? []).filter((p) => !keep.has(p.path));
  if (removed.length) {
    await supabase.from("cat_photos").delete().in("id", removed.map((p) => p.id));
    await supabase.storage.from("cat-photos").remove(removed.map((p) => p.path));
  }
  const byPath = new Map((existingPhotos ?? []).map((p) => [p.path, p.id]));
  for (const [position, photo] of input.photos.entries()) {
    const existingId = byPath.get(photo.path);
    const alt = photo.alt.trim().slice(0, 200);
    const { error } = existingId
      ? await supabase.from("cat_photos").update({ position, alt }).eq("id", existingId)
      : await supabase.from("cat_photos").insert({ cat_id: id, path: photo.path, alt, position });
    if (error) return { error: `Saved the cat, but a photo failed: ${error.message}`, id };
  }

  revalidatePublic(slug);
  revalidatePath("/admin", "layout");
  return { id };
}

export async function setCatStatus(formData: FormData) {
  const supabase = await staffClient();
  const id = String(formData.get("id"));
  const status = formData.get("status") === "pending" ? "pending" : "available";
  const { data } = await supabase.from("cats").update({ status }).eq("id", id).neq("status", "adopted").select("slug").single();
  revalidatePublic(data?.slug);
  revalidatePath("/admin", "layout");
}

export async function deleteCat(formData: FormData) {
  const supabase = await staffClient();
  const id = String(formData.get("id"));
  const { data: photos } = await supabase.from("cat_photos").select("path").eq("cat_id", id);
  const { data: cat, error } = await supabase.from("cats").delete().eq("id", id).select("slug").single();
  if (error) throw new Error(error.message);
  if (photos?.length) await supabase.storage.from("cat-photos").remove(photos.map((p) => p.path));
  revalidatePublic(cat?.slug);
  revalidatePath("/admin", "layout");
  redirect("/admin/cats");
}
