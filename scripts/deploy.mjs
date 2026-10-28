/**
 * Builds the site and deploys it to Cloudflare (bnrescues.com).
 *
 *   npm run deploy
 *
 * 1. Builds against an empty local database (wrangler.jsonc → env.build), so no
 *    sample or old data is ever baked into the pre-rendered pages.
 * 2. Uploads the Worker, but not the page cache. Those pages were built from the
 *    empty database, so uploading them only spent KV writes (the free plan allows
 *    1,000 a day) on pages that had to be rendered again anyway. Each page is now
 *    rendered from the live database on its first visit and cached in KV then.
 * 3. Marks every page from this build as out of date in the live tag cache, as a
 *    safeguard in case anything from this build is ever in the cache.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function run(cmd, args, env = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bnrescues.com";

run("npx", ["wrangler", "d1", "migrations", "apply", "DB", "--local", "--env", "build"]);
run("npx", ["opennextjs-cloudflare", "build"], { NEXT_DEV_WRANGLER_ENV: "build", NEXT_PUBLIC_SITE_URL: siteUrl });
// `opennextjs-cloudflare deploy` would upload the page cache first, so call wrangler
// directly. OPEN_NEXT_DEPLOY stops wrangler from handing back to OpenNext.
run("npx", ["wrangler", "deploy", "--env="], { OPEN_NEXT_DEPLOY: "true" });

// Every page carries the root layout tag, so one row covers the whole site.
// The table is OpenNext's tag cache; its deploy command used to create it.
const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
const now = Date.now();
run("npx", [
  "wrangler",
  "d1",
  "execute",
  "DB",
  "--remote",
  "--command",
  "create table if not exists revalidations (tag text not null, revalidatedAt integer not null, stale integer, expire integer default null, unique(tag) on conflict replace); " +
    `insert into revalidations (tag, revalidatedAt, stale, expire) values ('${buildId}/_N_T_/layout', ${now}, ${now}, null)`,
]);

console.log(`\n✓ Deployed to ${siteUrl}`);
