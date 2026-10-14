import { DemoCats } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { CatStatusBadge, Empty, PageHeader, Thumb } from "@/components/admin/ui";
import { deleteCat, setCatStatus } from "@/lib/admin/cat-actions";
import { requireStaff } from "@/lib/admin/session";
import { CAT_SELECT } from "@/lib/data";
import { catSummary, toCatView } from "@/lib/cats";
import type { Cat } from "@/lib/types";
import { ConfirmSubmit } from "@/components/admin/Forms";

export const metadata = { title: "Cats" };

export default async function AdminCatsPage({ searchParams }: PageProps<"/admin/cats">) {
  if (isDemo) return <DemoCats />;
  const { saved } = await searchParams;
  const { supabase } = await requireStaff();
  const { data } = await supabase
    .from("cats")
    .select(CAT_SELECT)
    .in("status", ["available", "pending"])
    .order("created_at", { ascending: false });
  const cats = ((data ?? []) as Cat[]).map((c) => ({ raw: c, view: toCatView(c) }));

  return (
    <>
      <PageHeader
        title="Cats"
        description="Cats listed on the website. Adopted cats move to the Adopted section."
        actions={
          <Link href="/admin/cats/new" className="btn-primary">
            + Add a cat
          </Link>
        }
      />
      {typeof saved === "string" && (
        <p role="status" className="mb-6 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Saved {saved}. It&apos;s live on the website.
        </p>
      )}
      {cats.length === 0 ? (
        <Empty>No cats listed yet. Add your first one!</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {cats.map(({ view: c }) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap sm:px-5">
              <Thumb url={c.photos[0]?.url} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/cats/${c.id}`} className="font-serif text-xl hover:underline">
                    {c.name}
                  </Link>
                  <CatStatusBadge status={c.status} />
                </div>
                <p className="truncate text-xs text-muted">
                  {catSummary(c)} · {c.photos.length} {c.photos.length === 1 ? "photo" : "photos"}
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <form action={setCatStatus}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value={c.status === "pending" ? "available" : "pending"} />
                  <button className="btn-ghost px-3 py-1.5 text-xs">
                    {c.status === "pending" ? "Mark available" : "Mark pending"}
                  </button>
                </form>
                <Link href={`/admin/cats/${c.id}/adopt`} className="btn-ghost px-3 py-1.5 text-xs">
                  Mark adopted
                </Link>
                <Link href={`/admin/cats/${c.id}`} className="btn-outline px-3 py-1.5 text-xs">
                  Edit
                </Link>
                <form action={deleteCat}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmit className="btn-ghost px-3 py-1.5 text-xs text-danger" message={`Delete ${c.name} and all photos? This can't be undone.`}>
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
