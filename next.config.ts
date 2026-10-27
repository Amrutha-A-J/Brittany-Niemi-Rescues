import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// GitHub Pages demo: a fully static build of demo mode (see scripts/build-pages.mjs).
const staticExport = process.env.NEXT_EXPORT === "1";

const nextConfig: NextConfig = {
  // Lets the demo dev server run beside the normal one without sharing a build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(staticExport && {
    output: "export",
    trailingSlash: true,
    // Project pages are served from https://<user>.github.io/<repo>/
    basePath: process.env.NEXT_BASE_PATH || "",
    // Server-action files are swapped for stand-ins in this build; the regular build type-checks them.
    typescript: { ignoreBuildErrors: true },
  }),
  // Classic caching model: public pages use ISR (`revalidate`) and admin
  // mutations call revalidatePath(). Simpler than Cache Components for this app.
  cacheComponents: false,
  // Photos are resized in the browser before upload. Next's image optimizer would
  // need Cloudflare Images, which isn't free past its monthly allowance.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Gives `next dev` the local D1 database and R2 bucket from wrangler.jsonc.
if (!staticExport) initOpenNextCloudflareForDev();
