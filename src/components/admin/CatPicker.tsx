"use client";

import { useState } from "react";
import { CATEGORIES, type PickerCat } from "@/lib/cats";
import { Thumb } from "./ui";

/**
 * A searchable, filterable list of cats to tick. Controlled (`selected` + `onChange`); pass `name`
 * to also submit the ticked ids with the surrounding form (one hidden input each).
 */
export function CatPicker({
  cats,
  selected,
  onChange,
  name,
}: {
  cats: PickerCat[];
  selected: string[];
  onChange: (ids: string[]) => void;
  name?: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sex, setSex] = useState("");
  const categories = CATEGORIES.filter((c) => cats.some((cat) => cat.category === c.value));
  const needle = q.trim().toLowerCase();
  const shown = cats.filter(
    (c) =>
      (!needle || `${c.name} ${c.summary}`.toLowerCase().includes(needle)) &&
      (!category || c.category === category) &&
      (!sex || c.sex === sex),
  );
  const toggle = (id: string, on: boolean) => onChange(on ? [...selected, id] : selected.filter((x) => x !== id));

  return (
    <div className="space-y-3">
      {name && selected.map((id) => <input key={id} type="hidden" name={name} value={id} />)}
      <input
        type="search"
        className="field"
        placeholder="Search by name or colour"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search cats"
      />
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="pill px-3 py-1.5 text-xs" aria-pressed={!category} onClick={() => setCategory("")}>
          All ages
        </button>
        {categories.map((c) => (
          <button key={c.value} type="button" className="pill px-3 py-1.5 text-xs" aria-pressed={category === c.value} onClick={() => setCategory(category === c.value ? "" : c.value)}>
            {c.plural}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
        {(["female", "male"] as const).map((s) => (
          <button key={s} type="button" className="pill px-3 py-1.5 text-xs" aria-pressed={sex === s} onClick={() => setSex(sex === s ? "" : s)}>
            {s === "female" ? "Female" : "Male"}
          </button>
        ))}
      </div>
      <ul className="max-h-[45dvh] divide-y divide-line overflow-y-auto rounded-xl border border-line">
        {shown.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-card">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-ink"
                checked={selected.includes(c.id)}
                onChange={(e) => toggle(c.id, e.target.checked)}
              />
              <Thumb url={c.photo} alt="" size={40} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{c.name}</span>
                <span className="block truncate text-xs text-muted">{c.summary}</span>
              </span>
            </label>
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No cats match.</li>}
      </ul>
      <p className="text-xs text-muted">
        {selected.length ? `${selected.length} selected` : "None selected"}
        {selected.length > 0 && (
          <>
            {" · "}
            <button type="button" className="underline underline-offset-2" onClick={() => onChange([])}>
              Clear
            </button>
          </>
        )}
      </p>
    </div>
  );
}
