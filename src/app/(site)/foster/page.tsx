import { activeBonds } from "@/lib/cats";
import type { Metadata } from "next";
import { DemoApplicationForm } from "@/components/demo/DemoPublic";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { getAdoptableCats } from "@/lib/data";
import { isDemo } from "@/lib/demo/config";
import { site } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Foster a cat in ${site.city}`,
  description: `Become a cat foster with ${site.name} in ${site.city}, ${site.region}. We cover food, litter and vet care.`,
  alternates: { canonical: "/foster" },
};

export default function FosterPage() {
  return (
    <section className="container-page max-w-[760px] pb-24 pt-14">
      <p className="eyebrow">Get involved</p>
      <h1 className="h-section mb-3 mt-2">Become a foster</h1>
      <p className="mb-10 text-[15px] leading-relaxed text-muted">
        Fosters are the heart of our rescue. You open your home for a few weeks or months, and we cover food, litter and
        vet care. Every foster home means one more cat we can say yes to.
      </p>
      {isDemo ? <DemoApplicationForm type="foster" /> : <LiveFosterForm />}
    </section>
  );
}

async function LiveFosterForm() {
  const cats = await getAdoptableCats();
  const options = cats
    .map((c) => ({ slug: c.slug, name: c.name, status: c.status, bondedWith: activeBonds(c).map((b) => b.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return <ApplicationForm type="foster" cats={options} />;
}
