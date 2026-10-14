"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/lib/admin/auth-actions";
import { formatDate, toLocalInputValue } from "@/lib/calendar";
import { FOSTER_KINDS, fosterStatusLabel, fosterSummary, type FosterStatus } from "@/lib/fosters";
import { links } from "@/lib/links";
import type { Foster, FosterWithPlacements } from "@/lib/types";
import { FilterBar, filterPanelClass } from "./FilterBar";
import { ActionForm, ConfirmSubmit, StatusMessage, SubmitButton } from "./Forms";
import { Card, Empty, PageHeader, rowButton, rowDangerButton } from "./ui";
import { site } from "@/lib/site";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type FormAction = (formData: FormData) => void | Promise<void>;

export type FosterActions = {
  save: Action;
  addPlacement: Action;
  endPlacement: FormAction;
  removePlacement: FormAction;
  remove: FormAction;
};

const statusStyle: Record<FosterStatus, string> = {
  fostering: "bg-amber-100 text-amber-900",
  available: "bg-emerald-100 text-emerald-900",
  on_break: "bg-card text-muted",
};

export function FosterStatusBadge({ status }: { status: FosterStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[status]}`}>
      {fosterStatusLabel[status]}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card font-serif text-lg">
      {initials}
    </span>
  );
}

function KindTags({ kinds }: { kinds: string[] }) {
  if (!kinds.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {kinds.map((k) => (
        <li key={k} className="rounded-full border border-line px-2.5 py-0.5 text-xs">
          {k}
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------------- list */

type Sort = "recent" | "most" | "name" | "newest";
const SORTS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Fostered most recently" },
  { value: "most", label: "Most cats fostered" },
  { value: "name", label: "Name (A–Z)" },
  { value: "newest", label: "Newest added" },
];
const DEFAULTS = { q: "", status: "all", kind: "all", sort: "recent" as Sort };

export function FosterList({ fosters }: { fosters: FosterWithPlacements[] }) {
  const [f, setF] = useState(DEFAULTS);
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<typeof DEFAULTS>) => setF((s) => ({ ...s, ...patch }));

  const rows = useMemo(() => fosters.map((foster) => ({ foster, ...fosterSummary(foster) })), [fosters]);
  const visible = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (!q ||
          [r.foster.name, r.foster.email, r.foster.phone, r.foster.city, ...r.placements.map((p) => p.cat_name)]
            .join(" ")
            .toLowerCase()
            .includes(q)) &&
        (f.status === "all" || r.status === f.status) &&
        (f.kind === "all" || r.foster.can_foster.includes(f.kind)),
    );
    const by: Record<Sort, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
      recent: (a, b) => (b.lastDate ?? "").localeCompare(a.lastDate ?? ""),
      most: (a, b) => b.count - a.count,
      name: (a, b) => a.foster.name.localeCompare(b.foster.name),
      newest: (a, b) => b.foster.created_at.localeCompare(a.foster.created_at),
    };
    return [...list].sort(by[f.sort]);
  }, [rows, f]);

  const activeCount = [f.q !== "", f.status !== "all", f.kind !== "all"].filter(Boolean).length;
  const clearFilters = () => setF({ ...DEFAULTS, sort: f.sort });

  if (fosters.length === 0) {
    return <Empty>No fosters yet. Approve a foster application, or add someone who has fostered before.</Empty>;
  }

  return (
    <>
      <FilterBar
        total={fosters.length}
        shown={visible.length}
        noun={["foster", "fosters"]}
        sortLabel={f.sort !== "recent" ? SORTS.find((s) => s.value === f.sort)?.label : undefined}
        activeCount={activeCount}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onClear={clearFilters}
        controls="foster-filters"
      />
      {open && (
        <div id="foster-filters" className={`${filterPanelClass} lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]`}>
          <label className="col-span-2 lg:col-span-1">
            <span className="field-label">Search</span>
            <input
              type="search"
              className="field py-2"
              placeholder="Name, email, phone or cat"
              autoFocus
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
            />
          </label>
          <label>
            <span className="field-label">Status</span>
            <select className="field py-2" value={f.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="all">Any</option>
              <option value="available">Available</option>
              <option value="fostering">Fostering now</option>
              <option value="on_break">On a break</option>
            </select>
          </label>
          <label>
            <span className="field-label">Can foster</span>
            <select className="field py-2" value={f.kind} onChange={(e) => set({ kind: e.target.value })}>
              <option value="all">Any</option>
              {FOSTER_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="col-span-2 lg:col-span-1">
            <span className="field-label">Sort by</span>
            <select className="field py-2" value={f.sort} onChange={(e) => set({ sort: e.target.value as Sort })}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-sm text-muted">
          No fosters match those filters.{" "}
          <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={clearFilters}>
            Clear filters
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {visible.map(({ foster, status, count, current, lastDate }) => (
            <li key={foster.id} className="flex gap-4 px-4 py-4 sm:px-5">
              <Initials name={foster.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <Link href={links.foster(foster.id)} className="font-serif text-[22px] leading-tight hover:underline">
                    {foster.name}
                  </Link>
                  <FosterStatusBadge status={status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {count} {count === 1 ? "cat" : "cats"} fostered
                  {current.length > 0
                    ? ` · now fostering ${current.map((p) => p.cat_name).join(", ")}`
                    : lastDate
                      ? ` · last fostered ${formatDate(lastDate)}`
                      : ""}
                </p>
                {foster.can_foster.length > 0 && (
                  <div className="mt-2">
                    <KindTags kinds={foster.can_foster} />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={links.foster(foster.id)} className={rowButton}>
                    View
                  </Link>
                  {foster.email && (
                    <a href={`mailto:${foster.email}`} className={rowButton}>
                      Email
                    </a>
                  )}
                  {foster.phone && (
                    <a href={`tel:${foster.phone}`} className={rowButton}>
                      Call {foster.phone}
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------------------------------------ details form */

export function FosterDetailsForm({ foster, action, submitLabel }: { foster?: Foster; action: Action; submitLabel: string }) {
  return (
    <ActionForm action={action}>
      {foster && <input type="hidden" name="id" value={foster.id} />}
      <label className="block">
        <span className="field-label">Name *</span>
        <input name="name" required className="field" defaultValue={foster?.name} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Email</span>
          <input name="email" type="email" className="field" defaultValue={foster?.email} />
        </label>
        <label className="block">
          <span className="field-label">Phone</span>
          <input name="phone" type="tel" className="field" defaultValue={foster?.phone} />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Town or city</span>
        <input name="city" className="field" defaultValue={foster?.city ?? site.city} />
      </label>
      <fieldset>
        <legend className="field-label">Can foster</legend>
        <div className="flex flex-wrap gap-2">
          {FOSTER_KINDS.map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center rounded-full border border-line px-3 py-1.5 text-xs has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
            >
              <input type="checkbox" name="can_foster" value={k} className="sr-only" defaultChecked={foster?.can_foster.includes(k)} />
              {k}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="field-label">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="field"
          defaultValue={foster?.notes}
          placeholder="Home setup, other pets, what they're great with…"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="on_break" defaultChecked={foster?.on_break} className="h-4 w-4 accent-ink" />
        On a break (not available to foster right now)
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}

/* ------------------------------------------------------------------ detail */

export function FosterDetail({
  foster,
  cats,
  actions,
}: {
  foster: FosterWithPlacements;
  /** Cats on the website, for adding to their history. */
  cats: { id: string; name: string }[];
  actions: FosterActions;
}) {
  const { placements, status, count } = fosterSummary(foster);
  const [today] = useState(() => toLocalInputValue(new Date().toISOString()).slice(0, 10));
  const [placementState, addPlacementAction] = useActionState(actions.addPlacement, {});
  const catIds = new Set(cats.map((c) => c.id));

  return (
    <>
      <PageHeader
        title={foster.name}
        back={{ href: "/admin/fosters", label: "Fosters" }}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <FosterStatusBadge status={status} />
            {count} {count === 1 ? "cat" : "cats"} fostered
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card title={`Foster history (${count})`}>
            {placements.length === 0 ? (
              <p className="text-sm text-muted">No cats recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {placements.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        {p.cat_id && catIds.has(p.cat_id) ? (
                          <Link href={links.cat(p.cat_id)} className="font-medium underline underline-offset-2">
                            {p.cat_name}
                          </Link>
                        ) : (
                          <span className="font-medium">{p.cat_name}</span>
                        )}
                        {!p.ended_on && <FosterStatusBadge status="fostering" />}
                      </p>
                      <p className="text-sm text-muted">
                        {formatDate(p.started_on)} – {p.ended_on ? formatDate(p.ended_on) : "now"}
                      </p>
                      {p.notes && <p className="mt-1 text-sm text-muted">{p.notes}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!p.ended_on && (
                        <form action={actions.endPlacement}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="foster_id" value={foster.id} />
                          <input type="hidden" name="ended_on" value={today} />
                          <button className={rowButton}>Mark as returned</button>
                        </form>
                      )}
                      <form action={actions.removePlacement}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="foster_id" value={foster.id} />
                        <ConfirmSubmit className={rowDangerButton} message={`Remove ${p.cat_name} from ${foster.name}'s history?`}>
                          Remove
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Add a cat to their history">
            {/* Remounts after each added cat, so the form starts fresh. */}
            <AddPlacementForm
              key={placements.length}
              fosterId={foster.id}
              cats={cats}
              today={today}
              action={addPlacementAction}
            />
            <div className="mt-4">
              <StatusMessage state={placementState} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-3 text-sm">
              {foster.email && (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd>
                    <a href={`mailto:${foster.email}`} className="underline underline-offset-2">
                      {foster.email}
                    </a>
                  </dd>
                </div>
              )}
              {foster.phone && (
                <div>
                  <dt className="text-xs text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${foster.phone}`} className="underline underline-offset-2">
                      {foster.phone}
                    </a>
                  </dd>
                </div>
              )}
              {foster.city && (
                <div>
                  <dt className="text-xs text-muted">Town or city</dt>
                  <dd>{foster.city}</dd>
                </div>
              )}
            </dl>
            {foster.can_foster.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs text-muted">Can foster</p>
                <KindTags kinds={foster.can_foster} />
              </div>
            )}
            {foster.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{foster.notes}</p>}
          </Card>

          <Card title="Edit details">
            <FosterDetailsForm key={foster.updated_at} foster={foster} action={actions.save} submitLabel="Save" />
          </Card>

          {foster.application_id && (
            <Link href={links.application(foster.application_id)} className="btn-outline w-full">
              View their foster application
            </Link>
          )}

          <form action={actions.remove}>
            <input type="hidden" name="id" value={foster.id} />
            <ConfirmSubmit
              message={`Remove ${foster.name} and their foster history? This can't be undone.`}
              className="text-sm text-danger underline underline-offset-2"
            >
              Remove from fosters
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}

function AddPlacementForm({
  fosterId,
  cats,
  today,
  action,
}: {
  fosterId: string;
  cats: { id: string; name: string }[];
  today: string;
  action: (formData: FormData) => void;
}) {
  const [catId, setCatId] = useState("");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="foster_id" value={fosterId} />
      <label className="block">
        <span className="field-label">Cat</span>
        <select name="cat_id" className="field" value={catId} onChange={(e) => setCatId(e.target.value)}>
          <option value="">A cat from before the website (type the name)</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {!catId && (
        <label className="block">
          <span className="field-label">Cat&apos;s name</span>
          <input name="cat_name" className="field" placeholder="e.g. Mochi" />
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Started</span>
          <input name="started_on" type="date" className="field" defaultValue={today} required />
        </label>
        <label className="block">
          <span className="field-label">Ended</span>
          <input name="ended_on" type="date" className="field" />
          <span className="field-hint">Leave empty if they&apos;re fostering now.</span>
        </label>
      </div>
      <label className="block">
        <span className="field-label">Notes</span>
        <input name="notes" className="field" placeholder="Optional" />
      </label>
      <SubmitButton>Add to history</SubmitButton>
    </form>
  );
}
