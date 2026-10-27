import { all } from "./db";
import { isDemo } from "./demo/config";
import { site } from "./site";

/** Website wording the rescue can change in the admin. Missing or blank values use these defaults. */
export const siteTextDefaults = {
  heroHeading: "Every cat deserves\na *soft place* to land.",
  heroIntro: `We rescue, foster and rehome cats of every age in ${site.city}, ${site.regionCode}, from bottle babies to golden-years seniors and the ones who need a little extra care.`,
};

export type SiteTextKey = keyof typeof siteTextDefaults;
export type SiteText = Record<SiteTextKey, string>;

export const siteTextKeys = Object.keys(siteTextDefaults) as SiteTextKey[];

export async function getSiteText(): Promise<SiteText> {
  if (isDemo) return { ...siteTextDefaults };
  const rows = await all<{ key: string; value: string }>("select key, value from site_text");
  const text = { ...siteTextDefaults };
  for (const r of rows) if (r.key in text && r.value.trim()) text[r.key as SiteTextKey] = r.value;
  return text;
}
