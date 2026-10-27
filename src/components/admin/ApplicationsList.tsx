import Link from "next/link";
import { APPLICATION_TABS, applicationListMeta } from "@/lib/admin/application-tabs";
import { requireStaff } from "@/lib/admin/session";
import { formatDate } from "@/lib/calendar";
import { all, nested, toApplication } from "@/lib/db";
import type { Application, ApplicationType } from "@/lib/types";
import { ApplicationStatusBadge, Empty, PageHeader } from "./ui";

type Row = Application & { cats: { id: string; name: string } | null };

/** One list per application type (adoption or foster), with status tabs. */
export async function ApplicationsList({
  type,
  searchParams,
}: {
  type: ApplicationType;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = APPLICATION_TABS.some((t) => t.value === sp.status) ? (sp.status as string) : "new";
  const catId = type === "adopt" && typeof sp.cat === "string" ? sp.cat : "";
  const meta = applicationListMeta[type];

  await requireStaff();
  const [data, counts, cats] = await Promise.all([
    all(
      `select a.*, json(case when c.id is null then null else json_object('id', c.id, 'name', c.name) end) as cats
       from applications a left join cats c on c.id = a.cat_id
       where a.type = ? and (? = 'all' or a.status = ?) and (? = '' or a.cat_id = ?)
       order by a.created_at desc`,
      type,
      status,
      status,
      catId,
      catId,
    ),
    all<{ status: string }>("select status from applications where type = ?", type),
    type === "adopt" ? all<{ id: string; name: string }>("select id, name from cats order by name") : Promise.resolve([]),
  ]);
  const rows: Row[] = data.map((r) => ({ ...toApplication(r), cats: nested<{ id: string; name: string }>(r.cats) }));
  const countBy = (s: string) => counts.filter((c) => s === "all" || c.status === s).length;

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ status, cat: catId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `${meta.href}?${p}`;
  };

  return (
    <>
      <PageHeader title={meta.title} description={meta.description} />

      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Application status">
        {APPLICATION_TABS.map((t) => (
          <Link key={t.value} href={href({ status: t.value })} className="pill" aria-current={status === t.value ? "page" : undefined}>
            {t.label} <span className="opacity-60">{countBy(t.value)}</span>
          </Link>
        ))}
      </nav>

      {type === "adopt" && (
        <form className="mb-6 flex flex-wrap items-end gap-3" action={meta.href}>
          <input type="hidden" name="status" value={status} />
          <label>
            <span className="field-label">Cat</span>
            <select name="cat" defaultValue={catId} className="field py-2">
              <option value="">Any cat</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-outline py-2">Filter</button>
          {catId && (
            <Link href={href({ cat: "" })} className="py-2 text-sm text-muted underline">
              Clear
            </Link>
          )}
        </form>
      )}

      {rows.length === 0 ? (
        <Empty>No {type === "adopt" ? "adoption" : "foster"} applications here.</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/applications/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-card/60 sm:px-5">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{a.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {a.cats?.name ?? (type === "adopt" ? "No specific cat" : "Open to any cat")} ·{" "}
                    {a.city || "—"}
                  </span>
                </span>
                <span className="text-xs text-muted">{formatDate(a.created_at)}</span>
                <ApplicationStatusBadge status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
