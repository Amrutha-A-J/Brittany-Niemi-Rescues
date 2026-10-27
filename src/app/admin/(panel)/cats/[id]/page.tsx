import { DemoCatEditor } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatForm } from "@/components/admin/CatForm";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { CAT_SQL, first, toCat } from "@/lib/db";

export const metadata = { title: "Edit cat" };

/** The static demo has one page per screen; the record id comes from `?id=`. */
export async function generateStaticParams() {
  return isDemo ? [{ id: "_" }] : [];
}

export default async function EditCatPage({ params }: PageProps<"/admin/cats/[id]">) {
  const { id } = await params;
  if (isDemo) return <DemoCatEditor id={id} />;
  await requireStaff();
  const data = await first(`${CAT_SQL} where c.id = ?`, id);
  if (!data) notFound();
  const cat = toCat(data);

  return (
    <>
      <PageHeader
        title={`Edit ${cat.name}`}
        back={{ href: cat.status === "adopted" ? `/admin/adopted/${cat.id}` : "/admin/cats", label: cat.status === "adopted" ? "Adoption record" : "Cats" }}
        actions={
          <>
            <Link href={`/cats/${cat.slug}`} target="_blank" className="btn-ghost">
              View on site ↗
            </Link>
            {cat.status !== "adopted" && (
              <Link href={`/admin/cats/${cat.id}/adopt`} className="btn-outline">
                Mark as adopted
              </Link>
            )}
          </>
        }
      />
      <CatForm cat={cat} />
    </>
  );
}
