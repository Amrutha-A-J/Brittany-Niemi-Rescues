import { DemoAdoptCat } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdoptionForm } from "@/components/admin/AdoptionForm";
import { PageHeader } from "@/components/admin/ui";
import { applicantOptions } from "@/lib/admin/applicants";
import { requireStaff } from "@/lib/admin/session";
import { all, first } from "@/lib/db";

export const metadata = { title: "Mark as adopted" };

/**
 * The static demo has one page per screen; the record id comes from `?id=`.
 * Only the demo defines this: with it, the live site would treat the page as static
 * and fail when the login check reads the session cookie.
 */
export const generateStaticParams = isDemo ? async () => [{ id: "_" }] : undefined;

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
  const partners = await all<{ id: string; name: string }>(
    "select o.id, o.name from cat_bonds b join cats o on o.id = b.bonded_id where b.cat_id = ? and o.status != 'adopted'",
    cat.id,
  );
  if (cat.status === "adopted") redirect(`/admin/adopted/${cat.id}`);

  return (
    <>
      <PageHeader
        title={`${cat.name} is going home!`}
        description="This removes them from the website and keeps a record in the Adopted section."
        back={{ href: `/admin/cats/${cat.id}`, label: cat.name }}
      />
      <div className="max-w-[760px]">
        {partners.length > 0 && (
          <p className="mb-6 rounded-xl border border-line bg-white px-4 py-3 text-sm">
            {cat.name} is bonded with{" "}
            {partners.map((p, i) => (
              <span key={p.id}>
                {i > 0 && (i === partners.length - 1 ? " and " : ", ")}
                <Link href={`/admin/cats/${p.id}/adopt`} className="underline">
                  {p.name}
                </Link>
              </span>
            ))}
            . Mark them as adopted too once they go home.
          </p>
        )}
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
