"use client";

import { useId, useSyncExternalStore } from "react";

export type Tab = { id: string; label: React.ReactNode; content: React.ReactNode };

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => window.location.hash.slice(1);

/**
 * Splits a page into tabs. The open tab is kept in the URL (#details), so a refresh or a
 * saved form stays on it. Hidden tabs stay mounted, so half-filled forms keep their values.
 */
export function Tabs({ tabs, className = "" }: { tabs: Tab[]; className?: string }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const active = tabs.some((t) => t.id === hash) ? hash : tabs[0].id;
  const base = useId();

  function open(id: string) {
    // replaceState keeps tab clicks out of the back button's history.
    history.replaceState(null, "", id === tabs[0].id ? location.pathname + location.search : `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <div className={className}>
      <div role="tablist" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${base}-${t.id}-tab`}
            aria-controls={`${base}-${t.id}`}
            aria-selected={t.id === active}
            onClick={() => open(t.id)}
            className="pill"
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-${t.id}`} aria-labelledby={`${base}-${t.id}-tab`} hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
