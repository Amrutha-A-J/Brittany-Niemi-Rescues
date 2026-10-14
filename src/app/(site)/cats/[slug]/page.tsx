import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatDetails } from "@/components/site/CatDetails";
import { JsonLd } from "@/components/site/JsonLd";
import { PhotoCarousel } from "@/components/site/PhotoCarousel";
import { metaDescription } from "@/lib/cats";
import { getAdoptableCats, getCatBySlug } from "@/lib/data";
import { site } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const cats = await getAdoptableCats();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cats/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCatBySlug(slug);
  if (!cat) return { title: "Cat not found", robots: { index: false } };

  const kind = cat.ageMonths < 12 ? "kitten" : "cat";
  const title = `${cat.name}, ${cat.ageLabel} old ${cat.color.toLowerCase()} ${kind} for adoption in ${site.city}`;
  const description = metaDescription(cat);
  const cover = cat.photos[0];
  return {
    title,
    description,
    alternates: { canonical: `/cats/${cat.slug}` },
    // Adopted cats keep their page (old links still work) but leave search results.
    robots: cat.status === "adopted" ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `Meet ${cat.name} | ${site.name}`,
      description,
      url: `/cats/${cat.slug}`,
      images: cover ? [{ url: cover.url, alt: cover.alt }] : undefined,
    },
  };
}

export default async function CatPage({ params }: PageProps<"/cats/[slug]">) {
  const { slug } = await params;
  const cat = await getCatBySlug(slug);
  if (!cat) notFound();

  return (
    <section className="container-page pb-24 pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: site.url },
            { "@type": "ListItem", position: 2, name: "Adopt", item: `${site.url}/adopt` },
            { "@type": "ListItem", position: 3, name: cat.name, item: `${site.url}/cats/${cat.slug}` },
          ],
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        {" / "}
        <Link href="/adopt" className="hover:text-ink">
          Adopt
        </Link>
        {" / "}
        <span className="text-ink">{cat.name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 md:gap-14">
        <PhotoCarousel photos={cat.photos} seed={cat.id} priority />
        <div className="md:pt-4">
          <CatDetails cat={cat} headingLevel="h1" />
          <Link href="/adopt" className="mt-10 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
            ← See all adoptable cats
          </Link>
        </div>
      </div>
    </section>
  );
}
