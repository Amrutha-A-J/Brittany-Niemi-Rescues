import { toCatView } from "./cats";
import { isDemo } from "./demo/config";
import seed from "./demo/seed.json";
import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured } from "./supabase/config";
import type { Cat, CatView } from "./types";

const sampleCats = seed.cats as unknown as Cat[];
const useSample = isDemo || !isSupabaseConfigured;

export const CAT_SELECT = "*, cat_photos(id, path, alt, position)";

/** Cats that are looking for a home (available + pending), newest first. */
export async function getAdoptableCats(): Promise<CatView[]> {
  if (useSample) {
    return sampleCats.filter((c) => c.status !== "adopted").map((c) => toCatView(c));
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cats")
    .select(CAT_SELECT)
    .in("status", ["available", "pending"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Cat[]).map((c) => toCatView(c));
}

export async function getCatBySlug(slug: string): Promise<CatView | null> {
  if (useSample) {
    const cat = sampleCats.find((c) => c.slug === slug);
    return cat ? toCatView(cat) : null;
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("cats").select(CAT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toCatView(data as Cat) : null;
}
