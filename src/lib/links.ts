import { isDemo } from "./demo/config";

/**
 * Admin and cat links. The demo is a static site (GitHub Pages) that can't have a page per
 * record, so it uses one page per screen with the record id in the query string.
 */
const byId = (base: string, id: string, extra = "") =>
  isDemo ? `${base}/_${extra}?id=${encodeURIComponent(id)}` : `${base}/${id}${extra}`;

export const links = {
  cat: (id: string) => byId("/admin/cats", id),
  adoptCat: (id: string, applicationId?: string) =>
    byId("/admin/cats", id, "/adopt") + (applicationId ? `${isDemo ? "&" : "?"}application=${applicationId}` : ""),
  application: (id: string) => byId("/admin/applications", id),
  adopted: (id: string) => byId("/admin/adopted", id),
  foster: (id: string) => byId("/admin/fosters", id),
  /** Public page for a cat. Demo cats added in the browser have no static page, so use the pop-up. */
  publicCat: (slug: string) => (isDemo ? `/adopt?cat=${encodeURIComponent(slug)}` : `/cats/${slug}`),
};
