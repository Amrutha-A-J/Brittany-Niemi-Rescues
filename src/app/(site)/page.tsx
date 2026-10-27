import type { Metadata } from "next";
import Link from "next/link";
import { CatBrowser } from "@/components/site/CatBrowser";
import { JsonLd } from "@/components/site/JsonLd";
import { Logo } from "@/components/site/Logo";
import { RichHeading } from "@/components/site/RichHeading";
import { getAdoptableCats } from "@/lib/data";
import { SocialIcon } from "@/components/site/SocialIcons";
import { site, socialLinks } from "@/lib/site";
import { getSiteText } from "@/lib/site-text";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const steps = [
  { title: "Find your cat", body: "Browse the cats above and tap any one to read their story." },
  { title: "Apply", body: "Send a short application so we can learn about your home and routine." },
  { title: "Meet", body: "We set up a visit with the cat and their foster family." },
  { title: "Go home", body: "Sign the adoption agreement and welcome your new family member." },
];

export default async function HomePage() {
  const [cats, text] = await Promise.all([getAdoptableCats(), getSiteText()]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AnimalShelter",
          "@id": `${site.url}/#organization`,
          name: site.name,
          alternateName: site.shortName,
          url: site.url,
          logo: `${site.url}/icon-512.png`,
          image: `${site.url}/opengraph-image.png`,
          description: site.description,
          areaServed: `${site.city}, ${site.region}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: site.city,
            addressRegion: site.regionCode,
            addressCountry: site.country,
          },
          sameAs: socialLinks.map((s) => s.href),
        }}
      />

      <section className="container-page pb-20 pt-16 text-center sm:pt-20">
        <Logo className="mx-auto h-[110px] sm:h-[150px]" />
        <h1 className="mx-auto mt-4 max-w-[680px] font-serif text-[44px] leading-[1.08] sm:text-[56px]">
          <RichHeading text={text.heroHeading} />
        </h1>
        <p className="mx-auto mt-6 max-w-[440px] text-[15px] leading-relaxed text-muted">{text.heroIntro}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="#cats" className="btn-primary">
            Meet the cats
          </Link>
          <Link href="/foster" className="btn-outline">
            Foster with us
          </Link>
        </div>
      </section>

      <section id="cats" className="container-page scroll-mt-6">
        <div className="border-t border-line pt-16">
          <p className="eyebrow">Adoptable cats</p>
          <h2 className="h-section mb-6 mt-2">Looking for home</h2>
          <CatBrowser cats={cats} variant="home" />
        </div>
      </section>

      <section id="how-it-works" className="container-page mt-20 scroll-mt-6">
        <div className="border-t border-line pt-16">
          <p className="eyebrow">Adopting</p>
          <h2 className="h-section mt-2">How it works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="font-serif text-[34px] leading-none">{i + 1}</span>
                <h3 className="mt-3 text-sm font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="help" className="container-page mb-20 mt-20 scroll-mt-6">
        <div className="border-t border-line pt-16">
          <p className="eyebrow">Get involved</p>
          <h2 className="h-section mt-2">Help us help them</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <HelpCard
              title="Foster"
              body="Open your home for a few weeks. We cover food, litter and vet care. You provide the lap."
            >
              <Link href="/foster" className="btn-outline">
                Become a foster
              </Link>
            </HelpCard>
            <HelpCard title="Follow along" body="New arrivals, updates and happy tails, posted on Instagram and Facebook.">
              {socialLinks.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener" className="btn-outline">
                  <SocialIcon name={s.name} className="h-4 w-4" />
                  {s.name}
                </a>
              ))}
            </HelpCard>
          </div>
        </div>
      </section>
    </>
  );
}

function HelpCard({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-sm border border-line p-6 sm:p-7">
      <h3 className="font-serif text-[26px]">{title}</h3>
      <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-6 flex flex-wrap gap-3">{children}</div>
    </div>
  );
}
