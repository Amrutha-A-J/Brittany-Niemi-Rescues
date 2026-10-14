"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/cats";
import type { CatCategory, CatView } from "@/lib/types";
import { CatCard } from "./CatCard";
import { CatModal } from "./CatModal";

type Sort = "newest" | "name" | "youngest" | "oldest";
type Filters = {
  category: "all" | CatCategory;
  sex: "all" | "female" | "male";
  status: "all" | "available" | "pending";
  q: string;
  sort: Sort;
};

const DEFAULTS: Filters = { category: "all", sex: "all", status: "all", q: "", sort: "newest" };
const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest arrivals" },
  { value: "name", label: "Name (A–Z)" },
  { value: "youngest", label: "Youngest first" },
  { value: "oldest", label: "Oldest first" },
];

function readFilters(params: URLSearchParams): Filters {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T) => {
    const v = params.get(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  };
  return {
    category: pick("age", ["all", ...CATEGORIES.map((c) => c.value)] as const, "all"),
    sex: pick("sex", ["all", "female", "male"] as const, "all"),
    status: pick("status", ["all", "available", "pending"] as const, "all"),
    q: params.get("q") ?? "",
    sort: pick("sort", SORTS.map((s) => s.value), "newest"),
  };
}

function buildUrl(filters: Filters, cat: string | null, syncFilters: boolean) {
  const params = new URLSearchParams();
  if (syncFilters) {
    if (filters.category !== "all") params.set("age", filters.category);
    if (filters.sex !== "all") params.set("sex", filters.sex);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
  }
  if (cat) params.set("cat", cat);
  const qs = params.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
}

export function CatBrowser({ cats, variant }: { cats: CatView[]; variant: "home" | "full" }) {
  const full = variant === "full";
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const pushedRef = useRef(false);

  // Read filters and the open cat from the URL after hydration, so the
  // server-rendered HTML always contains the full list for search engines.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (full) setFilters(readFilters(params));
    else {
      const age = readFilters(params).category;
      if (age !== "all") setFilters((f) => ({ ...f, category: age }));
    }
    setOpenSlug(params.get("cat"));
    /* eslint-enable react-hooks/set-state-in-effect */

    const onPop = () => {
      pushedRef.current = false;
      setOpenSlug(new URLSearchParams(window.location.search).get("cat"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [full]);

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    window.history.replaceState(window.history.state, "", buildUrl(next, openSlug, true));
  };

  const open = (cat: CatView) => {
    setOpenSlug(cat.slug);
    pushedRef.current = true;
    window.history.pushState(window.history.state, "", buildUrl(filters, cat.slug, full || filters.category !== "all"));
  };

  const close = useCallback(() => {
    if (pushedRef.current) {
      window.history.back();
    } else {
      setOpenSlug(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("cat");
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>([["all", cats.length]]);
    for (const c of cats) map.set(c.category, (map.get(c.category) ?? 0) + 1);
    return map;
  }, [cats]);

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const list = cats.filter(
      (c) =>
        (filters.category === "all" || c.category === filters.category) &&
        (filters.sex === "all" || c.sex === filters.sex) &&
        (filters.status === "all" || c.status === filters.status) &&
        (!q || c.name.toLowerCase().includes(q) || c.color.toLowerCase().includes(q)),
    );
    const sorted = [...list];
    if (filters.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (filters.sort === "youngest") sorted.sort((a, b) => a.ageMonths - b.ageMonths);
    if (filters.sort === "oldest") sorted.sort((a, b) => b.ageMonths - a.ageMonths);
    return sorted;
  }, [cats, filters]);

  const shown = full ? visible : visible.slice(0, 12);
  const openCat = openSlug ? cats.find((c) => c.slug === openSlug) : undefined;
  const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULTS);

  return (
    <div>
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        role="group"
        aria-label="Filter by age"
      >
        <button type="button" className="pill" aria-pressed={filters.category === "all"} onClick={() => update({ category: "all" })}>
          All cats <span className="opacity-60">{counts.get("all") ?? 0}</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className="pill"
            aria-pressed={filters.category === c.value}
            onClick={() => update({ category: c.value })}
          >
            {c.plural} <span className="opacity-60">{counts.get(c.value) ?? 0}</span>
          </button>
        ))}
      </div>

      {full && (
        <div className="mt-5 grid grid-cols-2 gap-3 border-b border-line pb-6 sm:flex sm:flex-wrap sm:items-end">
          <label className="col-span-2 sm:w-64">
            <span className="field-label">Search</span>
            <input
              type="search"
              className="field"
              placeholder="Name or colour"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
            />
          </label>
          <label className="sm:w-40">
            <span className="field-label">Sex</span>
            <select className="field" value={filters.sex} onChange={(e) => update({ sex: e.target.value as Filters["sex"] })}>
              <option value="all">Any</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="sm:w-44">
            <span className="field-label">Status</span>
            <select
              className="field"
              value={filters.status}
              onChange={(e) => update({ status: e.target.value as Filters["status"] })}
            >
              <option value="all">Any</option>
              <option value="available">Available</option>
              <option value="pending">Adoption pending</option>
            </select>
          </label>
          <label className="col-span-2 sm:ml-auto sm:w-48">
            <span className="field-label">Sort by</span>
            <select className="field" value={filters.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {full && (
        <p className="mt-5 text-sm text-muted" aria-live="polite">
          {visible.length} {visible.length === 1 ? "cat" : "cats"}
          {filtered && (
            <>
              {" · "}
              <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={() => update(DEFAULTS)}>
                Clear filters
              </button>
            </>
          )}
        </p>
      )}

      {shown.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((cat, i) => (
            <li key={cat.id}>
              <CatCard cat={cat} onOpen={open} priority={i < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl bg-card px-6 py-16 text-center">
          <p className="font-serif text-2xl">No cats match those filters</p>
          <p className="mt-2 text-sm text-muted">New cats arrive often, so check back soon.</p>
          <button type="button" className="btn-outline mt-6" onClick={() => update(DEFAULTS)}>
            Show all cats
          </button>
        </div>
      )}

      {!full && (
        <div className="mt-12 flex justify-center">
          <Link href="/adopt" className="btn-outline">
            See all {cats.length} cats, with filters &amp; sorting →
          </Link>
        </div>
      )}

      {openCat && <CatModal cat={openCat} onClose={close} />}
    </div>
  );
}
