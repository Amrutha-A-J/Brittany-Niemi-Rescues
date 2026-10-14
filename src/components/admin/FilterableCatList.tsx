"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/cats";
import type { CatCategory, CatView } from "@/lib/types";

type Sort = "newest" | "updated" | "name" | "youngest" | "oldest";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest added" },
  { value: "updated", label: "Recently edited" },
  { value: "name", label: "Name (A–Z)" },
  { value: "youngest", label: "Youngest first" },
  { value: "oldest", label: "Oldest first" },
];

const DEFAULTS = { q: "", status: "all", category: "all", sex: "all", sort: "newest" as Sort };

/**
 * Admin cat list with search, filters and sorting. Each item carries the cat's data
 * (for filtering) and its already-rendered row, so the server and demo versions can
 * supply their own row actions.
 */
export function FilterableCatList({ items }: { items: { cat: CatView; row: React.ReactNode }[] }) {
  const [f, setF] = useState(DEFAULTS);
  const set = (patch: Partial<typeof DEFAULTS>) => setF((s) => ({ ...s, ...patch }));

  const visible = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = items.filter(
      ({ cat }) =>
        (!q || cat.name.toLowerCase().includes(q) || cat.color.toLowerCase().includes(q)) &&
        (f.status === "all" || cat.status === f.status) &&
        (f.category === "all" || cat.category === f.category) &&
        (f.sex === "all" || cat.sex === f.sex),
    );
    const by: Record<Sort, (a: CatView, b: CatView) => number> = {
      newest: (a, b) => b.created_at.localeCompare(a.created_at),
      updated: (a, b) => b.updated_at.localeCompare(a.updated_at),
      name: (a, b) => a.name.localeCompare(b.name),
      youngest: (a, b) => a.ageMonths - b.ageMonths,
      oldest: (a, b) => b.ageMonths - a.ageMonths,
    };
    return [...list].sort((a, b) => by[f.sort](a.cat, b.cat));
  }, [items, f]);

  const filtered = f.q !== "" || f.status !== "all" || f.category !== "all" || f.sex !== "all";

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <label className="col-span-2 lg:col-span-1">
          <span className="field-label">Search</span>
          <input
            type="search"
            className="field py-2"
            placeholder="Name or colour"
            value={f.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </label>
        <label>
          <span className="field-label">Status</span>
          <select className="field py-2" value={f.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="all">Any</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
          </select>
        </label>
        <label>
          <span className="field-label">Age group</span>
          <select className="field py-2" value={f.category} onChange={(e) => set({ category: e.target.value as CatCategory | "all" })}>
            <option value="all">Any</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.plural}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Sex</span>
          <select className="field py-2" value={f.sex} onChange={(e) => set({ sex: e.target.value })}>
            <option value="all">Any</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label>
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

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {filtered ? `${visible.length} of ${items.length}` : items.length} {items.length === 1 ? "cat" : "cats"}
        {filtered && (
          <>
            {" · "}
            <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={() => setF({ ...DEFAULTS, sort: f.sort })}>
              Clear filters
            </button>
          </>
        )}
      </p>

      {visible.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {visible.map(({ cat, row }) => (
            <li key={cat.id}>{row}</li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-sm text-muted">
          No cats match those filters.
        </p>
      )}
    </>
  );
}
