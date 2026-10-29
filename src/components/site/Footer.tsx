import { DeveloperCredit } from "./DeveloperCredit";
import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="container-page mt-auto">
      <div className="flex flex-col items-center gap-4 border-t border-line py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" aria-label={`${site.name} home`}>
          <Logo className="h-12 sm:h-14" />
        </Link>
        <div className="flex flex-col items-center gap-3 text-xs text-muted sm:flex-row sm:flex-wrap sm:justify-end sm:gap-x-6">
          <SocialIcons />
          <span>
            Cat rescue in {site.city}, {site.region}
          </span>
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
        </div>
      </div>
      <div className="pb-8 text-center text-[11px] text-muted sm:text-right">
        <DeveloperCredit />
      </div>
    </footer>
  );
}
