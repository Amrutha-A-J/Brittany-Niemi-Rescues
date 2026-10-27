import Link from "next/link";
import { catSummary, namesList } from "@/lib/cats";
import type { ApplicationStatus, CatStatus, CatView } from "@/lib/types";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[34px] leading-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

const appStatus: Record<ApplicationStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-ink text-white" },
  meet_scheduled: { label: "Meet & greet", cls: "bg-amber-100 text-amber-900" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Rejected", cls: "bg-card text-muted" },
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const s = appStatus[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

const catStatus: Record<CatStatus, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-900" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-900" },
  adopted: { label: "Adopted", cls: "bg-card text-muted" },
};

export function CatStatusBadge({ status }: { status: CatStatus }) {
  const s = catStatus[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-sm text-muted">{children}</p>;
}

export function Thumb({ url, alt = "", size = 48 }: { url?: string; alt?: string; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} width={size} height={size} className="shrink-0 rounded-lg bg-card object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-lg bg-card text-faint" style={{ width: size, height: size }} aria-hidden>
      🐾
    </span>
  );
}

/**
 * One cat in the admin list: name and status on the first line, summary on the
 * second, and the action buttons (children) on their own line underneath.
 */
export function CatRow({ cat, href, children }: { cat: CatView; href: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-4 py-4 sm:px-5">
      <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden>
        <Thumb url={cat.photos[0]?.url} size={72} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Link href={href} className="font-serif text-[22px] leading-tight hover:underline">
            {cat.name}
          </Link>
          <CatStatusBadge status={cat.status} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {catSummary(cat)} · {cat.photos.length} {cat.photos.length === 1 ? "photo" : "photos"}
          {cat.bonded.length > 0 && <> · Bonded with {namesList(cat.bonded.map((b) => b.name))}</>}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

/** Small button style for the actions under each row. */
export const rowButton = "btn-outline px-3.5 py-1.5 text-xs";
export const rowDangerButton = "btn px-3 py-1.5 text-xs text-danger hover:bg-danger/5";
