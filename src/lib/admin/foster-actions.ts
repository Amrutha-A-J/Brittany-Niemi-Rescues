"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { all, batch, insertSql, newId, run, updateSql } from "@/lib/db";
import { FOSTER_KINDS, catNames, placementCats } from "@/lib/fosters";
import type { FormState } from "./auth-actions";
import { assertStaff } from "./session";

const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
const dateOrNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function fosterFields(fd: FormData) {
  return {
    name: text(fd, "name"),
    email: text(fd, "email"),
    phone: text(fd, "phone"),
    city: text(fd, "city"),
    can_foster: JSON.stringify(fd.getAll("can_foster").map(String).filter((k) => FOSTER_KINDS.includes(k))),
    notes: text(fd, "notes"),
    on_break: fd.get("on_break") === "on" ? 1 : 0,
  };
}

function refresh(id?: string) {
  revalidatePath("/admin/fosters");
  if (id) revalidatePath(`/admin/fosters/${id}`);
}

export async function createFoster(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertStaff();
  const fields = fosterFields(fd);
  if (!fields.name) return { error: "Add their name." };
  const id = newId();
  await run(...insertSql("fosters", { id, ...fields }));
  refresh();
  redirect(`/admin/fosters/${id}`);
}

export async function updateFoster(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertStaff();
  const id = text(fd, "id");
  const fields = fosterFields(fd);
  if (!fields.name) return { error: "Add their name." };
  await run(...updateSql("fosters", id, fields));
  refresh(id);
  return { message: "Saved." };
}

export async function deleteFoster(fd: FormData) {
  await assertStaff();
  await run("delete from fosters where id = ?", text(fd, "id"));
  refresh();
  redirect("/admin/fosters");
}

export async function addPlacement(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertStaff();
  const fosterId = text(fd, "foster_id");
  const siteCats = await all<{ id: string; name: string }>("select id, name from cats");
  const names = new Map(siteCats.map((c) => [c.id, c.name]));
  const cats = placementCats(fd, (id) => names.get(id));
  if (!cats.length) return { error: "Tick at least one cat, or type the name of a cat from before the website." };
  const startedOn = dateOrNull(text(fd, "started_on"));
  if (!startedOn) return { error: "Add the date they started fostering." };
  const endedOn = dateOrNull(text(fd, "ended_on"));
  const notes = text(fd, "notes");
  await batch(
    cats.map((c) =>
      insertSql("foster_placements", {
        id: newId(),
        foster_id: fosterId,
        ...c,
        started_on: startedOn,
        ended_on: endedOn,
        notes,
      }),
    ),
  );
  refresh(fosterId);
  return { ok: true, message: `Added ${catNames(cats)}.` };
}

export async function endPlacement(fd: FormData) {
  await assertStaff();
  await run(
    "update foster_placements set ended_on = ? where id = ?",
    dateOrNull(text(fd, "ended_on")) ?? new Date().toISOString().slice(0, 10),
    text(fd, "id"),
  );
  refresh(text(fd, "foster_id"));
}

export async function removePlacement(fd: FormData) {
  await assertStaff();
  await run("delete from foster_placements where id = ?", text(fd, "id"));
  refresh(text(fd, "foster_id"));
}
