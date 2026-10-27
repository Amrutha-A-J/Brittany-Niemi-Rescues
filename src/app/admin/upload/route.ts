import type { NextRequest } from "next/server";
import { assertStaff } from "@/lib/admin/session";
import { cf } from "@/lib/db";
import { MAX_PHOTO_BYTES, PHOTO_KEY } from "@/lib/photos";

/** Stores a cat photo (already resized to WebP by the browser) in the R2 bucket. */
export async function POST(request: NextRequest) {
  try {
    await assertStaff();
  } catch {
    return Response.json({ error: "Please log in again." }, { status: 401 });
  }
  const key = request.nextUrl.searchParams.get("path") ?? "";
  if (!PHOTO_KEY.test(key)) return Response.json({ error: "Bad photo name." }, { status: 400 });
  const body = await request.arrayBuffer();
  if (!body.byteLength || body.byteLength > MAX_PHOTO_BYTES) {
    return Response.json({ error: "That photo is too large." }, { status: 413 });
  }
  await (await cf()).PHOTOS.put(key, body, { httpMetadata: { contentType: "image/webp" } });
  return Response.json({ path: key });
}
