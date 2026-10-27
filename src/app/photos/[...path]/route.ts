import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PHOTO_KEY } from "@/lib/photos";

/**
 * Serves cat photos from the R2 bucket. Keys never change, so browsers can cache them for good.
 * Copies are also kept in Cloudflare's edge cache, so repeat views don't count as R2 reads
 * (R2 bills past its free tier; the edge cache is free).
 */
export async function GET(request: Request, ctx: RouteContext<"/photos/[...path]">) {
  const key = (await ctx.params).path.join("/");
  if (!PHOTO_KEY.test(key)) return new Response("Not found", { status: 404 });

  // Only in the Workers runtime (not `next dev`), and only on a custom domain.
  const edge = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(new URL(request.url).toString());
  const cached = await edge?.match(cacheKey);
  if (cached) return cached;

  const { env, ctx: worker } = await getCloudflareContext({ async: true });
  const object = await env.PHOTOS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const response = new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      etag: object.httpEtag,
    },
  });
  if (edge) worker.waitUntil(edge.put(cacheKey, response.clone()));
  return response;
}
