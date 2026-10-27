import { DemoAdopted } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { Empty, PageHeader, Thumb } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { formatDate } from "@/lib/calendar";
import { photoUrl } from "@/lib/cats";
import { all, nested } from "@/lib/db";
import type { Adoption } from "@/lib/types";

export const metadata = { title: "Adopted" };

type Row = {
  id: string;
  name: string;
  color: string;
  cat_photos: { path: string; position: number }[];
  adoption: Adoption | null;
};

export default async function AdoptedPage({ searchParams }: PageProps<"/admin/adopted">) {
  if (isDemo) return <DemoAdopted />;
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().toLowerCase() : "";
  await requireStaff();
  const data = await all(
    `select c.id, c.name, c.color,
       (select json_group_array(json_object('path', p.path, 'position', p.position)) from cat_photos p where p.cat_id = c.id) as cat_photos,
       (select json_object('id', d.id, 'cat_id', d.cat_id, 'application_id', d.application_id, 'adopted_on', d.adopted_on,
          'adopter_name', d.adopter_name, 'adopter_email', d.adopter_email, 'adopter_phone', d.adopter_phone,
          'adopter_address', d.adopter_address, 'fee_paid', d.fee_paid, 'microchip_number', d.microchip_number,
          'follow_up_on', d.follow_up_on, 'notes', d.notes, 'created_at', d.created_at)
        from adoptions d where d.cat_id = c.id) as adoption
     from cats c where c.status = 'adopted'`,
  );

  const rows = data
    .map((c): Row => ({ ...(c as Row), cat_photos: nested(c.cat_photos) ?? [], adoption: nested(c.adoption) }))
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
