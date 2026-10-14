import type { NextConfig } from "next";

// Local Supabase serves photos from 127.0.0.1, which the image optimizer refuses to fetch.
const localSupabase = /^http:\/\/(127\.0\.0\.1|localhost)/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

const nextConfig: NextConfig = {
  // Lets the demo dev server run beside the normal one without sharing a build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Classic caching model: public pages use ISR (`revalidate`) and admin
  // mutations call revalidatePath(). Simpler than Cache Components for this app.
  cacheComponents: false,
  images: {
    qualities: [75],
    unoptimized: localSupabase,
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
