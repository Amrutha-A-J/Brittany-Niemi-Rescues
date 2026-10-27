"use client";

import { useSyncExternalStore } from "react";

type Theme = "auto" | "light" | "dark";

const KEY = "bnr-theme";
const next: Record<Theme, Theme> = { auto: "light", light: "dark", dark: "auto" };
const label: Record<Theme, string> = { auto: "Auto", light: "Light", dark: "Dark" };

/** Runs in <head> before the page paints, so a saved Light/Dark choice never flashes the other theme. */
export const themeScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

// The choice lives on <html data-theme>, so every toggle on the page stays in step.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => (listeners.add(cb), () => listeners.delete(cb));
const read = (): Theme => {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "auto";
};

/** Cycles Auto (follow the device) → Light → Dark, and remembers the choice in this browser. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const current = useSyncExternalStore(subscribe, read, () => "auto" as Theme);

  function choose(t: Theme) {
    const root = document.documentElement;
    if (t === "auto") delete root.dataset.theme;
    else root.dataset.theme = t;
    try {
      if (t === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {}
    listeners.forEach((l) => l());
  }

  return (
    <button
      type="button"
      onClick={() => choose(next[current])}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-muted transition-colors hover:bg-card hover:text-ink ${className}`}
      aria-label={`Theme: ${label[current]}. Switch to ${label[next[current]]}`}
      title={`Theme: ${label[current]}`}
    >
      <ThemeIcon theme={current} />
      <span className="hidden sm:inline">{label[current]}</span>
    </button>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;
  if (theme === "light")
    return (
      <svg {...common} strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (theme === "dark")
    return (
      <svg {...common} strokeLinejoin="round">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
