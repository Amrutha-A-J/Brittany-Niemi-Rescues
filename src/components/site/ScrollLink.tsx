"use client";

/**
 * A link to a section on this page that scrolls there on every tap. A Next.js <Link href="#id">
 * does nothing when the address already ends in that #id, or after CatBrowser has rewritten the
 * address with history.replaceState, which happened a lot on phones.
 */
export function ScrollLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        const target = document.getElementById(to);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#${to}`);
      }}
    >
      {children}
    </a>
  );
}
