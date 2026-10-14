import type { Metadata } from "next";
import { DemoApplicationForm } from "@/components/demo/DemoPublic";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { isDemo } from "@/lib/demo/config";
import { getAdoptableCats } from "@/lib/data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Adoption application",
  description: `Apply to adopt a cat from ${site.name} in ${site.city}, ${site.region}.`,
  alternates: { canonical: "/apply" },
};

export default async function ApplyPage({ searchParams }: PageProps<"/apply">) {
  const { cat } = await searchParams;
  const cats = await getAdoptableCats();
  const options = cats.map((c) => ({ slug: c.slug, name: c.name, status: c.status })).sort((a, b) => a.name.localeCompare(b.name));
  const defaultCat = typeof cat === "string" && options.some((c) => c.slug === cat) ? cat : "";

  return (
    <section className="container-page max-w-[760px] pb-24 pt-14">
      <p className="eyebrow">Adopting</p>
      <h1 className="h-section mb-3 mt-2">Adoption application</h1>
      <p className="mb-10 text-[15px] leading-relaxed text-muted">
        It takes about 5 minutes. There are no wrong answers. It just helps us match the right cat with the right home.
      </p>
      {isDemo ? (
        <DemoApplicationForm type="adopt" defaultCat={typeof cat === "string" ? cat : ""} />
      ) : (
        <ApplicationForm type="adopt" cats={options} defaultCat={defaultCat} />
      )}
    </section>
  );
}
