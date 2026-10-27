import type { Cat, CatCategory, CatView } from "./types";
import { site } from "./site";

export const CATEGORIES: { value: CatCategory; label: string; plural: string }[] = [
  { value: "kitten", label: "Kitten", plural: "Kittens" },
  { value: "teenager", label: "Teenager", plural: "Teenagers" },
  { value: "young-adult", label: "Young adult", plural: "Young adults" },
  { value: "adult", label: "Adult", plural: "Adults" },
  { value: "senior", label: "Senior", plural: "Seniors" },
  { value: "special", label: "Special need", plural: "Special needs" },
];

export function categoryLabel(category: CatCategory) {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

/** Whole months between a birth date (YYYY-MM-DD) and now. */
export function ageInMonths(birthDate: string, now = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const days = (now.getTime() - birth.getTime()) / 86_400_000;
  return Math.max(0, days / 30.4375);
}

/** "10 weeks", "8 months", "1.5 years", "13 years". */
export function formatAge(months: number) {
  if (months < 4) {
    const weeks = Math.max(1, Math.round((months * 30.4375) / 7));
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }
  if (months < 12) {
    const m = Math.floor(months);
    return `${m} months`;
  }
  const years = months / 12;
  if (years < 2) {
    const rounded = Math.floor(years * 2) / 2;
    return rounded === 1 ? "1 year" : `${rounded} years`;
  }
  return `${Math.floor(years)} years`;
}

export function ageCategory(months: number): Exclude<CatCategory, "special"> {
  if (months < 6) return "kitten";
  if (months < 12) return "teenager";
  if (months < 36) return "young-adult";
  if (months < 120) return "adult";
  return "senior";
}

export function photoUrl(path: string) {
  if (/^(https?:|data:)/.test(path)) return path;
  return `/photos/${path}`;
}

export function photoAlt(cat: Pick<Cat, "name" | "color" | "sex">, months: number) {
  const kind = months < 12 ? "kitten" : "cat";
  return `${cat.name}, a ${cat.color ? cat.color.toLowerCase() + " " : ""}${kind} available for adoption`;
}

export function toCatView(cat: Cat, now = new Date()): CatView {
  const { cat_photos, ...rest } = cat;
  const months = ageInMonths(cat.birth_date, now);
  const photos = [...(cat_photos ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((p) => ({ url: photoUrl(p.path), alt: p.alt || photoAlt(cat, months) }));
  return {
    ...rest,
    bonded: cat.bonded ?? [],
    photos,
    ageMonths: months,
    ageLabel: formatAge(months),
    category: cat.special_needs ? "special" : ageCategory(months),
  };
}

/** Bonded partners still looking for a home (an adopted partner no longer ties this cat down). */
export function activeBonds(cat: Pick<Cat, "bonded">) {
  return (cat.bonded ?? []).filter((b) => b.status !== "adopted");
}

export const bondLabel = (partners: number) => (partners === 1 ? "Bonded pair" : "Bonded group");

/** "Pip", "Pip and Rosie", "Pip, Rosie and Bean" */
export function namesList(names: string[]) {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** What the admin cat pickers need to show and filter a cat. */
export type PickerCat = { id: string; name: string; summary: string; category?: CatCategory; sex?: string; photo?: string };

export const toPickerCat = (c: CatView): PickerCat => ({
  id: c.id,
  name: c.name,
  summary: catSummary(c),
  category: c.category,
  sex: c.sex,
  photo: c.photos[0]?.url,
});

export function sexLabel(sex: string) {
  return sex === "female" ? "Female" : "Male";
}

export function catSummary(cat: CatView) {
  return [sexLabel(cat.sex), cat.ageLabel, cat.color].filter(Boolean).join(" · ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function metaDescription(cat: CatView) {
  const kind = cat.ageMonths < 12 ? "kitten" : "cat";
  const base = `Meet ${cat.name}, a ${cat.ageLabel} old ${cat.sex} ${cat.color.toLowerCase()} ${kind} looking for a home in ${site.city}, ${site.region}.`;
  const extra = cat.description ? ` ${cat.description}` : "";
  const text = (base + extra).replace(/\s+/g, " ").trim();
  return text.length > 158 ? text.slice(0, 155).replace(/\s+\S*$/, "") + "…" : text;
}
