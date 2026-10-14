import type { MetadataRoute } from "next";
import { getAdoptableCats } from "@/lib/data";
import { site } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cats = await getAdoptableCats();
  const latest = cats.reduce((d, c) => (c.updated_at > d ? c.updated_at : d), "2026-01-01");
  return [
    { url: site.url, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/adopt`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/foster`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/apply`, changeFrequency: "monthly", priority: 0.5 },
    ...cats.map((c) => ({
      url: `${site.url}/cats/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: c.photos.slice(0, 3).map((p) => p.url),
    })),
  ];
}
