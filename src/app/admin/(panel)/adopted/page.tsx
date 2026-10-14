import { DemoAdopted } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { Empty, PageHeader, Thumb } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { formatDate } from "@/lib/calendar";
import { photoUrl } from "@/lib/cats";
import type { Adoption } from "@/lib/types";

export const metadata = { title: "Adopted" };

type Row = {
  id: string;
  name: string;
  color: string;
  cat_photos: { path: string; position: number }[];
  adoptions: Adoption | Adoption[] | null;
};

export default async function AdoptedPage({ searchParams }: PageProps<"/admin/adopted">) {
  const { q } = await searchParams;
  if (isDemo) return <DemoAdopted q={typeof q === "string" ? q : undefined} />;
  const search = typeof q === "string" ? q.trim().toLowerCase() : "";
  const { supabase } = await requireStaff();
  const { data } = await supabase
    .from("cats")
    .select("id, name, color, cat_photos(path, position), adoptions(*)")
    .eq("status", "adopted");

  const rows = ((data ?? []) as Row[])
    .map((c) => ({ ...c, adoption: Array.isArray(c.adoptions) ? c.adoptions[0] : c.adoptions }))
    .filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search) ||
        c.adoption?.adopter_name.toLowerCase().includes(search) ||
        c.adoption?.adopter_email.toLowerCase().includes(search),
    )
    .sort((a, b) => (b.adoption?.adopted_on ?? "").localeCompare(a.adoption?.adopted_on ?? ""));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Adopted" description="Every cat that has found a home, with who adopted them." />
      <form className="mb-6 flex max-w-md gap-2" action="/admin/adopted">
        <input type="search" name="q" defaultValue={search} placeholder="Search cat or adopter" className="field" aria-label="Search" />
        <button className="btn-outline">Search</button>
      </form>
      {rows.length === 0 ? (
        <Empty>{search ? "No matches." : "No adoptions recorded yet. Use “Mark adopted” on a cat when they go home."}</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const cover = [...c.cat_photos].sort((a, b) => a.position - b.position)[0];
            const followUpDue = c.adoption?.follow_up_on && c.adoption.follow_up_on <= today;
            return (
              <li key={c.id}>
                <Link href={`/admin/adopted/${c.id}`} className="flex gap-4 rounded-2xl border border-line bg-white p-4 hover:border-ink">
                  <Thumb url={cover ? photoUrl(cover.path) : undefined} size={72} />
                  <div className="min-w-0">
                    <p className="font-serif text-xl leading-tight">{c.name}</p>
                    <p className="truncate text-sm">{c.adoption?.adopter_name ?? "No adopter recorded"}</p>
                    <p className="text-xs text-muted">{c.adoption ? `Adopted ${formatDate(c.adoption.adopted_on)}` : ""}</p>
                    {followUpDue && <p className="mt-1 text-xs font-medium text-amber-700">Follow-up due</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
