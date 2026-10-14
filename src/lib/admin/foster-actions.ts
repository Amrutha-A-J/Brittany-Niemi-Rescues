"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FOSTER_KINDS } from "@/lib/fosters";
import type { FormState } from "./auth-actions";
import { staffClient } from "./session";

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const dateOrNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function fosterFields(fd: FormData) {
  return {
    name: text(fd, "name"),
    email: text(fd, "email"),
    phone: text(fd, "phone"),
    city: text(fd, "city"),
    can_foster: fd.getAll("can_foster").map(String).filter((k) => FOSTER_KINDS.includes(k)),
    notes: text(fd, "notes"),
    on_break: fd.get("on_break") === "on",
  };
}

function refresh(id?: string) {
  revalidatePath("/admin/fosters");
  if (id) revalidatePath(`/admin/fosters/${id}`);
}

export async function createFoster(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await staffClient();
  const fields = fosterFields(fd);
  if (!fields.name) return { error: "Add their name." };
  const { data, error } = await supabase.from("fosters").insert(fields).select("id").single();
  if (error) return { error: error.message };
  refresh();
  redirect(`/admin/fosters/${data.id}`);
}

export async function updateFoster(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await staffClient();
  const id = text(fd, "id");
  const fields = fosterFields(fd);
  if (!fields.name) return { error: "Add their name." };
  const { error } = await supabase.from("fosters").update(fields).eq("id", id);
  if (error) return { error: error.message };
  refresh(id);
  return { message: "Saved." };
}

export async function deleteFoster(fd: FormData) {
  const supabase = await staffClient();
  await supabase.from("fosters").delete().eq("id", text(fd, "id"));
  refresh();
  redirect("/admin/fosters");
}

export async function addPlacement(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await staffClient();
  const fosterId = text(fd, "foster_id");
  const catId = text(fd, "cat_id");
  let catName = text(fd, "cat_name");
  if (catId) {
    const { data: cat } = await supabase.from("cats").select("name").eq("id", catId).single();
    catName = cat?.name ?? catName;
  }
  if (!catName) return { error: "Choose a cat, or type the name of a cat from before the website." };
  const startedOn = dateOrNull(text(fd, "started_on"));
  if (!startedOn) return { error: "Add the date they started fostering." };
  const { error } = await supabase.from("foster_placements").insert({
    foster_id: fosterId,
    cat_id: catId || null,
    cat_name: catName,
    started_on: startedOn,
    ended_on: dateOrNull(text(fd, "ended_on")),
    notes: text(fd, "notes"),
  });
  if (error) return { error: error.message };
  refresh(fosterId);
  return { ok: true, message: `Added ${catName}.` };
}

export async function endPlacement(fd: FormData) {
  const supabase = await staffClient();
  await supabase
    .from("foster_placements")
    .update({ ended_on: dateOrNull(text(fd, "ended_on")) ?? new Date().toISOString().slice(0, 10) })
    .eq("id", text(fd, "id"));
  refresh(text(fd, "foster_id"));
}

export async function removePlacement(fd: FormData) {
  const supabase = await staffClient();
  await supabase.from("foster_placements").delete().eq("id", text(fd, "id"));
  refresh(text(fd, "foster_id"));
}
