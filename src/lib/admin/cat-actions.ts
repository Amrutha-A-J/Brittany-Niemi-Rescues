"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/cats";
import { all, batch, bool, cf, first, insertSql, newId, run, updateSql } from "@/lib/db";
import type { CatStatus, Sex, YesNoUnknown } from "@/lib/types";
import { assertStaff } from "./session";

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

/** Removes photos from the R2 bucket. Sample photos are full URLs and aren't ours to delete. */
async function removePhotoFiles(paths: string[]) {
  const keys = paths.filter((p) => !/^(https?:|data:)/.test(p));
  if (keys.length) await (await cf()).PHOTOS.delete(keys);
}

export async function saveCat(input: CatInput): Promise<{ error?: string; id?: string }> {
  await assertStaff();

  const name = input.name.trim();
  if (!name) return { error: "Give the cat a name." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birth_date)) return { error: "Add a birth date (an estimate is fine)." };

  const row = {
    name,
    sex: input.sex === "male" ? "male" : "female",
    birth_date: input.birth_date,
    color: input.color.trim(),
    breed: input.breed.trim(),
    special_needs: bool(input.special_needs),
    special_needs_notes: input.special_needs ? input.special_needs_notes.trim() : "",
    description: input.description.trim(),
    personality: JSON.stringify(input.personality.map((p) => p.trim()).filter(Boolean).slice(0, 12)),
    good_with_kids: yn(input.good_with_kids),
    good_with_cats: yn(input.good_with_cats),
    good_with_dogs: yn(input.good_with_dogs),
    spayed_neutered: bool(input.spayed_neutered),
    vaccinated: bool(input.vaccinated),
    microchipped: bool(input.microchipped),
    adoption_fee: input.adoption_fee != null && Number.isFinite(input.adoption_fee) ? Math.round(input.adoption_fee) : null,
  };

  let id = input.id;
  let slug: string;

  try {
    if (id) {
      const existing = await first<{ slug: string; status: string }>("select slug, status from cats where id = ?", id);
      if (!existing) return { error: "That cat no longer exists." };
      slug = existing.slug;
      // Adopted cats keep their status here; adoption is managed from the Adopted section.
      const status = existing.status === "adopted" ? "adopted" : input.status === "pending" ? "pending" : "available";
      await run(...updateSql("cats", id, { ...row, status }));
    } else {
      // Keep slugs stable and unique: "pickle", "pickle-2", …
      const base = slugify(name) || "cat";
      const taken = await all<{ slug: string }>("select slug from cats where slug like ?", `${base}%`);
      const used = new Set(taken.map((t) => t.slug));
      slug = base;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      id = newId();
      await run(...insertSql("cats", { id, ...row, slug, status: input.status === "pending" ? "pending" : "available" }));
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save the cat." };
  }

  // Sync photos: the order in `input.photos` is the display order (first = cover).
  const catId = id;
  try {
    const existingPhotos = await all<{ id: string; path: string }>("select id, path from cat_photos where cat_id = ?", catId);
    const keep = new Set(input.photos.map((p) => p.path));
    const removed = existingPhotos.filter((p) => !keep.has(p.path));
    const byPath = new Map(existingPhotos.map((p) => [p.path, p.id]));
    await batch([
      ...removed.map((p): [string, string] => ["delete from cat_photos where id = ?", p.id]),
      ...input.photos.map((photo, position) => {
        const existingId = byPath.get(photo.path);
        const alt = photo.alt.trim().slice(0, 200);
        return existingId
          ? updateSql("cat_photos", existingId, { position, alt })
          : insertSql("cat_photos", { id: newId(), cat_id: catId, path: photo.path, alt, position });
      }),
    ]);
    await removePhotoFiles(removed.map((p) => p.path));
  } catch (e) {
    return { error: `Saved the cat, but a photo failed: ${e instanceof Error ? e.message : "unknown error"}`, id };
  }

  revalidatePublic(slug);
  revalidatePath("/admin", "layout");
  return { id };
}

export async function setCatStatus(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id"));
  const status = formData.get("status") === "pending" ? "pending" : "available";
  const cat = await first<{ slug: string }>(
    "update cats set status = ? where id = ? and status != 'adopted' returning slug",
    status,
    id,
  );
  revalidatePublic(cat?.slug);
  revalidatePath("/admin", "layout");
}

export async function deleteCat(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id"));
  const photos = await all<{ path: string }>("select path from cat_photos where cat_id = ?", id);
  const cat = await first<{ slug: string }>("delete from cats where id = ? returning slug", id);
  await removePhotoFiles(photos.map((p) => p.path));
  revalidatePublic(cat?.slug);
  revalidatePath("/admin", "layout");
  redirect("/admin/cats");
}
