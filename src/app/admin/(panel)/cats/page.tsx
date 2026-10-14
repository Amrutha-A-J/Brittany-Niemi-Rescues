import { DemoCats } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { CatRow, Empty, PageHeader, rowButton, rowDangerButton } from "@/components/admin/ui";
import { deleteCat, setCatStatus } from "@/lib/admin/cat-actions";
import { requireStaff } from "@/lib/admin/session";
import { CAT_SELECT } from "@/lib/data";
import { toCatView } from "@/lib/cats";
import type { Cat } from "@/lib/types";
import { FilterableCatList } from "@/components/admin/FilterableCatList";
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
        <FilterableCatList
          items={cats.map(({ view: c }) => ({
            cat: c,
            row: (
            <CatRow cat={c} href={`/admin/cats/${c.id}`}>
              <Link href={`/admin/cats/${c.id}`} className={rowButton}>
                Edit
              </Link>
              <form action={setCatStatus}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value={c.status === "pending" ? "available" : "pending"} />
                <button className={rowButton}>{c.status === "pending" ? "Mark available" : "Mark pending"}</button>
              </form>
              <Link href={`/admin/cats/${c.id}/adopt`} className={rowButton}>
                Mark adopted
              </Link>
              <form action={deleteCat}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmSubmit className={rowDangerButton} message={`Delete ${c.name} and all photos? This can't be undone.`}>
                  Delete
                </ConfirmSubmit>
              </form>
            </CatRow>
            ),
          }))}
        />
      )}
    </>
  );
}
