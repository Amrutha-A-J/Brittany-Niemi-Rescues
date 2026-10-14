import type { Metadata } from "next";
import { CatBrowser } from "@/components/site/CatBrowser";
import { getAdoptableCats } from "@/lib/data";
import { site } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Adopt a cat in ${site.city}, ${site.regionCode}`,
  description: `Kittens, adults, seniors and special-needs cats looking for homes in ${site.city}, ${site.region}. Filter by age and sex, and apply online.`,
  alternates: { canonical: "/adopt" },
};

export default async function AdoptPage() {
  const cats = await getAdoptableCats();
  return (
    <section className="container-page pb-24 pt-14">
      <p className="eyebrow">Adoptable cats</p>
      <h1 className="h-section mb-3 mt-2">Cats looking for home</h1>
      <p className="mb-8 max-w-[560px] text-[15px] leading-relaxed text-muted">
        Every cat is vet-checked and living in a foster home in and around {site.city}, so we can tell you
        exactly what they&apos;re like. Tap a cat to see more photos and read their story.
      </p>
      <CatBrowser cats={cats} variant="full" />
    </section>
  );
}
