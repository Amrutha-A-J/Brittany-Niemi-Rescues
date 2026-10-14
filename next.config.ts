import type { NextConfig } from "next";

// Local Supabase serves photos from 127.0.0.1, which the image optimizer refuses to fetch.
const localSupabase = /^http:\/\/(127\.0\.0\.1|localhost)/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

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
  images: {
    qualities: [75],
    unoptimized: localSupabase || staticExport,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Sample cat photos used by demo mode
      { protocol: "https", hostname: "cdn2.thecatapi.com", pathname: "/images/**" },
    ],
  },
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
