/**
 * Builds the site and deploys it to Cloudflare (bnrescues.com).
 *
 *   npm run deploy
 *
 * 1. Builds against an empty local database (wrangler.jsonc → env.build), so no
 *    sample or old data is ever baked into the pre-rendered pages.
 * 2. Uploads the Worker and the page cache.
 * 3. Marks every page from this build as out of date in the live tag cache, so
 *    the first visit to each page renders it from the live database.
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
run("npx", ["opennextjs-cloudflare", "deploy", "--env="]);

// Every page carries the root layout tag, so one row covers the whole site.
const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
const now = Date.now();
run("npx", [
  "wrangler",
  "d1",
  "execute",
  "DB",
  "--remote",
  "--command",
  `insert into revalidations (tag, revalidatedAt, stale, expire) values ('${buildId}/_N_T_/layout', ${now}, ${now}, null)`,
]);

console.log(`\n✓ Deployed to ${siteUrl}`);
