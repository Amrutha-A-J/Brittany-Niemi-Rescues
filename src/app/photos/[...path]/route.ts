import { cf } from "@/lib/db";
import { PHOTO_KEY } from "@/lib/photos";

/** Serves cat photos from the R2 bucket. Keys never change, so browsers can cache them for good. */
export async function GET(_req: Request, ctx: RouteContext<"/photos/[...path]">) {
  const key = (await ctx.params).path.join("/");
  if (!PHOTO_KEY.test(key)) return new Response("Not found", { status: 404 });
  const object = await (await cf()).PHOTOS.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      etag: object.httpEtag,
    },
  });
}
