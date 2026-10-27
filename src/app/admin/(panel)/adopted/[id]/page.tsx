import { DemoAdoptedCat } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdoptionForm } from "@/components/admin/AdoptionForm";
import { ConfirmSubmit } from "@/components/admin/Forms";
import { Card, PageHeader, Thumb } from "@/components/admin/ui";
import { returnToAvailable } from "@/lib/admin/adoption-actions";
import { applicantOptions } from "@/lib/admin/applicants";
import { requireStaff } from "@/lib/admin/session";
import { CAT_SQL, first, toAdoption, toCat } from "@/lib/db";
import { catSummary, toCatView } from "@/lib/cats";

export const metadata = { title: "Adoption record" };

/** The static demo has one page per screen; the record id comes from `?id=`. */
export async function generateStaticParams() {
  return isDemo ? [{ id: "_" }] : [];
}

export default async function AdoptedCatPage({ params }: PageProps<"/admin/adopted/[id]">) {
  const { id } = await params;
  if (isDemo) return <DemoAdoptedCat id={id} />;
  await requireStaff();
  const [catRow, record] = await Promise.all([
    first(`${CAT_SQL} where c.id = ?`, id),
    first("select * from adoptions where cat_id = ?", id),
  ]);
  if (!catRow) notFound();
  const cat = toCatView(toCat(catRow));
  const adoption = record && toAdoption(record);

  return (
    <>
      <PageHeader
        title={cat.name}
        description={catSummary(cat)}
        back={{ href: "/admin/adopted", label: "Adopted" }}
        actions={
          <Link href={`/admin/cats/${cat.id}`} className="btn-outline">
            Edit cat details
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <AdoptionForm
            catId={cat.id}
            catName={cat.name}
            record={adoption}
            applicants={await applicantOptions(cat.id)}
            defaultFee={cat.adoption_fee}
            isNew={false}
          />
        </div>
        <div className="space-y-6">
          <Card title="Photos">
            {cat.photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {cat.photos.map((p) => (
                  <a key={p.url} href={p.url} target="_blank" rel="noopener">
                    <Thumb url={p.url} alt={p.alt} size={88} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No photos.</p>
            )}
          </Card>
          <Card title="Cat details">
            <dl className="space-y-2 text-sm">
              <Row label="Breed" value={cat.breed} />
              <Row label="Spayed / neutered" value={cat.spayed_neutered ? "Yes" : "No"} />
              <Row label="Vaccinated" value={cat.vaccinated ? "Yes" : "No"} />
              <Row label="Microchipped" value={cat.microchipped ? "Yes" : "No"} />
              {cat.special_needs && <Row label="Special care" value={cat.special_needs_notes || "Yes"} />}
            </dl>
            {cat.description && <p className="mt-4 text-sm text-muted">{cat.description}</p>}
          </Card>
          {adoption?.application_id && (
            <Link href={`/admin/applications/${adoption.application_id}`} className="btn-outline w-full">
              View their application
            </Link>
          )}
          <form action={returnToAvailable}>
            <input type="hidden" name="cat_id" value={cat.id} />
            <ConfirmSubmit
              message={`Put ${cat.name} back on the website as available? The adoption record will be deleted.`}
              className="text-sm text-danger underline underline-offset-2"
            >
              Adoption fell through? Return to available
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
