import { socialLinks } from "@/lib/site";

type Network = (typeof socialLinks)[number]["name"];

export function SocialIcon({ name, className = "h-5 w-5" }: { name: Network; className?: string }) {
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M13.4 21.9v-7.3h2.4l.4-2.9h-2.8V9.9c0-.8.3-1.4 1.4-1.4h1.5V5.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2.2H8.1v2.9h2.4v7.3"
        fill="var(--paper)"
      />
    </svg>
  );
}

/** Row of round icon links, e.g. for the footer. */
export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {socialLinks.map((s) => (
        <li key={s.name}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener"
            aria-label={`${s.name} (opens in a new tab)`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
          >
            <SocialIcon name={s.name} className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
