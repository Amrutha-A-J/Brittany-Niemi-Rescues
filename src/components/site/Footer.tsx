import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="container-page mt-auto">
      <div className="flex flex-col gap-4 border-t border-line py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label={`${site.name} home`}>
          <Logo size={24} />
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted">
          <SocialIcons />
          <span>
            Cat rescue in {site.city}, {site.region}
          </span>
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>
      </div>
      <p className="pb-8 text-center text-[11px] text-muted sm:text-left">
        Handcoded by Ami at{" "}
        <a href="https://pixelmoose.ca" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-ink">
          pixelmoose.ca
        </a>
      </p>
    </footer>
  );
}
