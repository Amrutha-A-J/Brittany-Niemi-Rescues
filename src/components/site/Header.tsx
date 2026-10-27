import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/adopt", label: "Adopt" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#help", label: "Help out" },
];

export function Header() {
  return (
    <header className="container-page">
      <div className="flex h-[72px] items-center justify-between border-b border-line">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.name} home`}>
          <Logo size={26} />
          <span className="hidden font-serif text-[17px] sm:inline">{site.name}</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
          <ul className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] text-muted transition-colors hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle className="-mx-1" />
          <Link href="/admin" className="btn-outline px-4 py-2 text-[13px]" rel="nofollow">
            Rescue login
          </Link>
        </nav>
      </div>
    </header>
  );
}
