import Link from "next/link";
import { instagramUrl, site } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="container-page mt-auto">
      <div className="flex flex-col gap-4 border-t border-line py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label={`${site.name} home`}>
          <Logo size={24} />
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          <span>
            Cat rescue in {site.city}, {site.region}
          </span>
          <a href={instagramUrl} className="hover:text-ink" target="_blank" rel="noopener">
            Instagram
          </a>
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>
      </div>
    </footer>
  );
}
