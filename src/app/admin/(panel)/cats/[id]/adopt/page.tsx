import { notFound, redirect } from "next/navigation";
import { AdoptionForm } from "@/components/admin/AdoptionForm";
import { PageHeader } from "@/components/admin/ui";
import { applicantOptions } from "@/lib/admin/applicants";
import { requireStaff } from "@/lib/admin/session";

export const metadata = { title: "Mark as adopted" };

export default async function AdoptCatPage({ params, searchParams }: PageProps<"/admin/cats/[id]/adopt">) {
  const { id } = await params;
  const { application } = await searchParams;
  const { supabase } = await requireStaff();
  const { data: cat } = await supabase.from("cats").select("id, name, status, adoption_fee").eq("id", id).maybeSingle();
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
          applicants={await applicantOptions(supabase, cat.id)}
          defaultApplication={typeof application === "string" ? application : undefined}
          defaultFee={cat.adoption_fee}
          isNew
        />
      </div>
    </>
  );
}
