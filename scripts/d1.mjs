/**
 * Database helpers that run SQL through Wrangler. Add --remote to use the live
 * Cloudflare database instead of the local one used by `npm run dev`.
 *
 *   npm run staff:add -- her@email.com [--remote]   create a rescue login (asks for a password)
 *   npm run db:seed [-- --remote]                     load the sample data from src/lib/demo/seed.json
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { webcrypto as crypto } from "node:crypto";

const [command, ...rest] = process.argv.slice(2);
const remote = rest.includes("--remote");
const args = rest.filter((a) => !a.startsWith("--"));

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const q = (v) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const b = (v) => (v ? 1 : 0);

function execute(sql) {
  const dir = mkdtempSync(join(tmpdir(), "bnr-"));
  const file = join(dir, "run.sql");
  writeFileSync(file, sql);
  const res = spawnSync("npx", ["wrangler", "d1", "execute", "DB", remote ? "--remote" : "--local", "--file", file, "-y"], {
    stdio: "inherit",
  });
  rmSync(dir, { recursive: true, force: true });
  if (res.status !== 0) fail("Wrangler couldn't run the SQL (see above). Have you run the migrations?");
}

/** Same format as src/lib/admin/auth.ts. */
async function hashPassword(password) {
  const iterations = 60_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return `pbkdf2$${iterations}$${Buffer.from(salt).toString("base64")}$${Buffer.from(bits).toString("base64")}`;
}

async function addStaff() {
  const email = args[0];
  if (!email?.includes("@")) fail("Give an email address, e.g. npm run staff:add -- her@email.com");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = await rl.question("Password for this login (at least 8 characters): ");
  rl.close();
  if (password.length < 8) fail("Use at least 8 characters.");
  execute(
    `insert into staff (id, email, password_hash) values (${q(crypto.randomUUID())}, ${q(email)}, ${q(await hashPassword(password))})
     on conflict (email) do update set password_hash = excluded.password_hash;`,
  );
  console.log(`\n✓ ${email} can log in at /admin${remote ? "" : " (local database)"}`);
}

function seed() {
  const data = JSON.parse(readFileSync(new URL("../src/lib/demo/seed.json", import.meta.url), "utf8"));
  const insert = (table, row) =>
    `insert or ignore into ${table} (${Object.keys(row).join(", ")}) values (${Object.values(row).map(q).join(", ")});`;
  const sql = [
    ...data.cats.flatMap(({ cat_photos, ...c }) => [
      insert("cats", {
        ...c,
        personality: JSON.stringify(c.personality),
        special_needs: b(c.special_needs),
        spayed_neutered: b(c.spayed_neutered),
        vaccinated: b(c.vaccinated),
        microchipped: b(c.microchipped),
      }),
      ...cat_photos.map((p) => insert("cat_photos", { ...p, cat_id: c.id })),
    ]),
    ...data.applications.map((a) => insert("applications", { ...a, answers: JSON.stringify(a.answers) })),
    ...data.meetings.map((m) => insert("meetings", m)),
    ...data.adoptions.map((a) => insert("adoptions", a)),
    ...data.fosters.map((f) => insert("fosters", { ...f, can_foster: JSON.stringify(f.can_foster), on_break: b(f.on_break) })),
    ...data.foster_placements.map((p) => insert("foster_placements", p)),
  ];
  execute(sql.join("\n"));
  console.log(`\n✓ Sample data loaded${remote ? " into the live database" : ""}. Existing rows were left alone.`);
}

switch (command) {
  case "staff":
    await addStaff();
    break;
  case "seed":
    seed();
    break;
  default:
    fail("Usage: node scripts/d1.mjs <staff|seed> [--remote]");
}
