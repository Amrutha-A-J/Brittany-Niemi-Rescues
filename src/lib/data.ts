import { toCatView } from "./cats";
import { CAT_SQL, all, first, toCat } from "./db";
import { isDemo } from "./demo/config";
import seed from "./demo/seed.json";
import type { Cat, CatView } from "./types";

const sampleCats = seed.cats as unknown as Cat[];

/** Cats that are looking for a home (available + pending), newest first. */
export async function getAdoptableCats(): Promise<CatView[]> {
  if (isDemo) {
    return sampleCats.filter((c) => c.status !== "adopted").map((c) => toCatView(c));
  }
  const rows = await all(`${CAT_SQL} where c.status in ('available', 'pending') order by c.created_at desc`);
  return rows.map((r) => toCatView(toCat(r)));
}

export async function getCatBySlug(slug: string): Promise<CatView | null> {
  if (isDemo) {
    const cat = sampleCats.find((c) => c.slug === slug);
    return cat ? toCatView(cat) : null;
  }
  const row = await first(`${CAT_SQL} where c.slug = ?`, slug);
  return row ? toCatView(toCat(row)) : null;
}
