import type { NextConfig } from "next";

// Local Supabase serves photos from 127.0.0.1, which the image optimizer refuses to fetch.
const localSupabase = /^http:\/\/(127\.0\.0\.1|localhost)/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

const nextConfig: NextConfig = {
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
