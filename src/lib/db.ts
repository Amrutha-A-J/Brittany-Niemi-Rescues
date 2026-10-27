import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Adoption, Application, Cat, CatPhoto, Foster, FosterPlacement, FosterWithPlacements, Meeting } from "./types";

/** Cloudflare bindings (D1 database, R2 photo bucket) for this request. */
export async function cf() {
  return (await getCloudflareContext({ async: true })).env;
}

type Param = string | number | null;

export async function all<T = Record<string, unknown>>(sql: string, ...params: Param[]): Promise<T[]> {
  const { DB } = await cf();
  const { results } = await DB.prepare(sql)
    .bind(...params)
    .all<T>();
  return results;
}

export async function first<T = Record<string, unknown>>(sql: string, ...params: Param[]): Promise<T | null> {
  const { DB } = await cf();
  return DB.prepare(sql)
    .bind(...params)
    .first<T>();
}

/** Runs a write and returns how many rows it changed. */
export async function run(sql: string, ...params: Param[]): Promise<number> {
  const { DB } = await cf();
  const { meta } = await DB.prepare(sql)
    .bind(...params)
    .run();
  return meta.changes;
}

/** Runs several writes in one transaction. */
export async function batch(statements: [sql: string, ...params: Param[]][]) {
  const { DB } = await cf();
  await DB.batch(statements.map(([sql, ...params]) => DB.prepare(sql).bind(...params)));
}

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
export const bool = (v: boolean) => (v ? 1 : 0);

/** `insert into <table> (…) values (…)` from an object. Keys are always code-defined column names. */
export function insertSql(table: string, row: Record<string, Param>): [string, ...Param[]] {
  const cols = Object.keys(row);
  return [`insert into ${table} (${cols.join(", ")}) values (${cols.map(() => "?").join(", ")})`, ...Object.values(row)];
}

/** `update <table> set … where id = ?` from an object. */
export function updateSql(table: string, id: string, row: Record<string, Param>): [string, ...Param[]] {
  const cols = Object.keys(row);
  return [`update ${table} set ${cols.map((c) => `${c} = ?`).join(", ")} where id = ?`, ...Object.values(row), id];
}

// ---------------------------------------------------------------------------
// Row shapes. SQLite has no booleans, arrays or nested rows, so queries return
// 0/1 and JSON text, and these turn them back into the app's types.
// ---------------------------------------------------------------------------

type Raw = Record<string, unknown>;
const json = <T>(v: unknown, fallback: T): T => (typeof v === "string" ? (JSON.parse(v) as T) : fallback);

/** A cat with its photos as JSON (`cat_photos`). Filter and sort with the `c` alias. */
export const CAT_SQL = `select c.*, (
  select json_group_array(json_object('id', p.id, 'path', p.path, 'alt', p.alt, 'position', p.position))
  from cat_photos p where p.cat_id = c.id
) as cat_photos from cats c`;

export function toCat(row: Raw): Cat {
  return {
    ...(row as unknown as Cat),
    special_needs: Boolean(row.special_needs),
    spayed_neutered: Boolean(row.spayed_neutered),
    vaccinated: Boolean(row.vaccinated),
    microchipped: Boolean(row.microchipped),
    personality: json<string[]>(row.personality, []),
    cat_photos: json<CatPhoto[]>(row.cat_photos, []),
  };
}

export function toApplication<T extends Raw>(row: T) {
  return { ...(row as unknown as Application), answers: json<Application["answers"]>(row.answers, {}) } as Application &
    Omit<T, keyof Application>;
}

/** Parses JSON columns built with json_object() (a joined row, or null). */
export function nested<T>(v: unknown): T | null {
  return json<T | null>(v, null);
}

/** A meeting with its application and that application's cat (`applications`). Use the `m` alias. */
export const MEETING_SQL = `select m.*, json(case when a.id is null then null else json_object(
  'id', a.id, 'name', a.name, 'email', a.email, 'phone', a.phone, 'type', a.type, 'status', a.status,
  'cats', json(case when ac.id is null then null else json_object('name', ac.name, 'slug', ac.slug) end)
) end) as applications
from meetings m
left join applications a on a.id = m.application_id
left join cats ac on ac.id = a.cat_id`;

export function toMeeting(row: Raw) {
  return { ...(row as unknown as Meeting), applications: nested(row.applications) };
}

export function toAdoption(row: Raw): Adoption {
  return row as unknown as Adoption;
}

/** A foster with every placement as JSON (`foster_placements`). Use the `f` alias. */
export const FOSTER_SQL = `select f.*, (
  select json_group_array(json_object(
    'id', fp.id, 'foster_id', fp.foster_id, 'cat_id', fp.cat_id, 'cat_name', fp.cat_name,
    'started_on', fp.started_on, 'ended_on', fp.ended_on, 'notes', fp.notes, 'created_at', fp.created_at
  )) from foster_placements fp where fp.foster_id = f.id
) as foster_placements from fosters f`;

export function toFoster(row: Raw): FosterWithPlacements {
  return {
    ...(row as unknown as Foster),
    on_break: Boolean(row.on_break),
    can_foster: json<string[]>(row.can_foster, []),
    foster_placements: json<FosterPlacement[]>(row.foster_placements, []),
  };
}
