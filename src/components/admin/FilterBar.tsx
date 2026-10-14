"use client";

/** "12 cats · Clear filters" on the left, a Filter & sort toggle on the right. */
export function FilterBar({
  total,
  shown,
  noun,
  sortLabel,
  activeCount,
  open,
  onToggle,
  onClear,
  controls,
}: {
  total: number;
  shown: number;
  noun: [singular: string, plural: string];
  /** Shown after the count when a non-default sort is chosen. */
  sortLabel?: string;
  activeCount: number;
  open: boolean;
  onToggle: () => void;
  onClear: () => void;
  /** id of the panel the toggle opens. */
  controls: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted" aria-live="polite">
        {activeCount ? `${shown} of ${total}` : total} {total === 1 ? noun[0] : noun[1]}
        {sortLabel && ` · ${sortLabel}`}
        {activeCount > 0 && (
          <>
            {" · "}
            <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={onClear}>
              Clear filters
            </button>
          </>
        )}
      </p>
      <button
        type="button"
        className={`${open ? "btn-primary" : "btn-outline"} px-4 py-2`}
        aria-expanded={open}
        aria-controls={controls}
        onClick={onToggle}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M3 5h14M6 10h8M8.5 15h3" strokeLinecap="round" />
        </svg>
        Filter &amp; sort
        {activeCount > 0 && (
          <span className={`rounded-full px-1.5 text-[11px] ${open ? "bg-white text-ink" : "bg-ink text-white"}`}>
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}

export const filterPanelClass = "mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4";
