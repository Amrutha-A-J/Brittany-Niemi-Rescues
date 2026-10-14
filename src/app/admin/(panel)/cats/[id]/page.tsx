import Link from "next/link";
import { notFound } from "next/navigation";
import { CatForm } from "@/components/admin/CatForm";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin/session";
import { CAT_SELECT } from "@/lib/data";
import type { Cat } from "@/lib/types";

export const metadata = { title: "Edit cat" };

export default async function EditCatPage({ params }: PageProps<"/admin/cats/[id]">) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("cats").select(CAT_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const cat = data as Cat;

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
