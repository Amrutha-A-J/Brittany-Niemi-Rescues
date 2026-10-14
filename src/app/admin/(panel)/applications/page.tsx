import Link from "next/link";
import { ApplicationStatusBadge, Empty, PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { formatDate } from "@/lib/calendar";
import { applicationTypeLabel } from "@/lib/forms";
import type { Application, ApplicationStatus } from "@/lib/types";

export const metadata = { title: "Applications" };

const TABS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "meet_scheduled", label: "Meet & greets" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

type Row = Application & { cats: { id: string; name: string } | null };

export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? (sp.status as string) : "new";
  const type = sp.type === "adopt" || sp.type === "foster" ? sp.type : "";
  const catId = typeof sp.cat === "string" ? sp.cat : "";

  const { supabase } = await requireStaff();
  let query = supabase.from("applications").select("*, cats(id, name)").order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (catId) query = query.eq("cat_id", catId);

  const [{ data }, { data: counts }, { data: cats }] = await Promise.all([
    query,
    supabase.from("applications").select("status"),
    supabase.from("cats").select("id, name").order("name"),
  ]);
  const rows = (data ?? []) as Row[];
  const countBy = (s: string) => (counts ?? []).filter((c) => s === "all" || c.status === s).length;

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ status, type, cat: catId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/applications?${p}`;
  };

  return (
    <>
      <PageHeader title="Applications" description="Adoption and foster applications from the website." />

      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Application status">
        {TABS.map((t) => (
          <Link key={t.value} href={href({ status: t.value })} className="pill" aria-current={status === t.value ? "page" : undefined}>
            {t.label} <span className="opacity-60">{countBy(t.value)}</span>
          </Link>
        ))}
      </nav>

      <form className="mb-6 flex flex-wrap items-end gap-3" action="/admin/applications">
        <input type="hidden" name="status" value={status} />
        <label>
          <span className="field-label">Type</span>
          <select name="type" defaultValue={type} className="field py-2">
            <option value="">Adoption &amp; foster</option>
            <option value="adopt">Adoption only</option>
            <option value="foster">Foster only</option>
          </select>
        </label>
        <label>
          <span className="field-label">Cat</span>
          <select name="cat" defaultValue={catId} className="field py-2">
            <option value="">Any cat</option>
            {(cats ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn-outline py-2">Filter</button>
        {(type || catId) && (
          <Link href={href({ type: "", cat: "" })} className="py-2 text-sm text-muted underline">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <Empty>No applications here.</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/applications/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-card/60 sm:px-5">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{a.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {applicationTypeLabel[a.type]}
                    {a.type === "adopt" && ` · ${a.cats?.name ?? "No specific cat"}`} · {a.city || "—"}
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
