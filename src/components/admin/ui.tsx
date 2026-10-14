import Link from "next/link";
import type { ApplicationStatus, CatStatus } from "@/lib/types";

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
