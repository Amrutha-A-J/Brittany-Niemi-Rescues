"use client";

import { useEffect, useRef } from "react";

/**
 * A pop-up built on <dialog>: Esc and the ✕ close it, and focus stays inside while it's open.
 * `closeOn` closes it whenever that value changes (e.g. a record's updated_at after a save).
 */
export function Modal({
  title,
  buttonLabel,
  buttonClassName,
  children,
  closeOn,
}: {
  title: string;
  /** The button that opens it. */
  buttonLabel: React.ReactNode;
  buttonClassName?: string;
  children: React.ReactNode;
  closeOn?: unknown;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.close();
  }, [closeOn]);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={buttonClassName}>
        {buttonLabel}
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 text-ink backdrop:bg-black/50"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <div className="max-h-[85dvh] overflow-y-auto p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-serif text-[24px] leading-tight">{title}</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-card"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
