import { contactEmail, facebookUrl, site } from "@/lib/site";
import { Logo } from "./Logo";

export function UnderConstruction() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center">
      <Logo className="h-16 sm:h-20" />
      <p className="eyebrow mt-10">Under construction</p>
      <h1 className="h-section mt-2">Our new website is almost ready</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        We&apos;re putting the finishing touches on it. In the meantime, reach out to us on Facebook or by email and we&apos;ll
        get back to you.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a href={facebookUrl} target="_blank" rel="noopener" className="btn-primary">
          Message us on Facebook
        </a>
        <a href={`mailto:${contactEmail}`} className="btn-outline">
          {contactEmail}
        </a>
      </div>
      <p className="mt-12 text-xs text-muted">
        {site.name} · Cat rescue in {site.city}, {site.region}
      </p>
    </main>
  );
}
