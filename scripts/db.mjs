/**
 * Database migration helper. Migrations live in supabase/migrations/ and each
 * database remembers which ones it has had, so only new ones are applied.
 *
 *   npm run db:new -- add_cat_weight     create a new migration file
 *   npm run db:migrate                    apply new migrations to your local database
 *   npm run db:status -- .env.demo        show which migrations a database has
 *   npm run db:push -- .env.demo          apply new migrations to that database
 *   npm run db:push -- .env.demo --dry-run   preview without applying
 *
 * The env file must contain DATABASE_URL (a Postgres connection string).
 * In CI, DATABASE_URL can come straight from the environment instead.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const [command, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith("--"));
const envFile = rest.find((a) => !a.startsWith("--"));

function loadEnv(file) {
  if (!file) return {};
  if (!existsSync(file)) fail(`Can't find ${file}.`);
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
  );
}

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function supabase(args) {
  const res = spawnSync("npx", ["supabase", ...args], { stdio: "inherit" });
  process.exit(res.status ?? 1);
}

function databaseUrl() {
  const url = loadEnv(envFile).DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    fail(
      `No DATABASE_URL${envFile ? ` in ${envFile}` : ""}.\n` +
        "  Supabase → Connect (top bar) → Session pooler → copy the URI and put your database password in it.",
    );
  }
  return url;
}

switch (command) {
  case "new": {
    const name = rest.join("_").replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    if (!name) fail("Give the migration a name, e.g. npm run db:new -- add_cat_weight");
    supabase(["migration", "new", name]);
    break;
  }
  case "migrate":
    supabase(["migration", "up", "--local"]);
    break;
  case "status":
    supabase(["migration", "list", "--db-url", databaseUrl()]);
    break;
  case "push":
    supabase(["db", "push", "--db-url", databaseUrl(), "--yes", ...flags.filter((f) => f === "--dry-run")]);
    break;
  default:
    fail("Usage: node scripts/db.mjs <new|migrate|status|push> [env-file] [--dry-run]");
}
