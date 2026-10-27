import { DemoAdoptCat } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import { notFound, redirect } from "next/navigation";
import { AdoptionForm } from "@/components/admin/AdoptionForm";
import { PageHeader } from "@/components/admin/ui";
import { applicantOptions } from "@/lib/admin/applicants";
import { requireStaff } from "@/lib/admin/session";
import { first } from "@/lib/db";

export const metadata = { title: "Mark as adopted" };

/** The static demo has one page per screen; the record id comes from `?id=`. */
export async function generateStaticParams() {
  return isDemo ? [{ id: "_" }] : [];
}

export default async function AdoptCatPage({ params, searchParams }: PageProps<"/admin/cats/[id]/adopt">) {
  const { id } = await params;
  if (isDemo) return <DemoAdoptCat id={id} />;
  const { application } = await searchParams;
  await requireStaff();
  const cat = await first<{ id: string; name: string; status: string; adoption_fee: number | null }>(
    "select id, name, status, adoption_fee from cats where id = ?",
    id,
  );
  if (!cat) notFound();
  if (cat.status === "adopted") redirect(`/admin/adopted/${cat.id}`);

  return (
    <>
      <PageHeader
        title={`${cat.name} is going home!`}
        description="This removes them from the website and keeps a record in the Adopted section."
        back={{ href: `/admin/cats/${cat.id}`, label: cat.name }}
      />
      <div className="max-w-[760px]">
        <AdoptionForm
          catId={cat.id}
          catName={cat.name}
          applicants={await applicantOptions(cat.id)}
          defaultApplication={typeof application === "string" ? application : undefined}
          defaultFee={cat.adoption_fee}
          isNew
        />
      </div>
    </>
  );
}
