/**
 * Creates a rescue login and (optionally) loads the 10 sample cats.
 *
 *   node --env-file=.env.local scripts/seed-demo.mts [email] [password]
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in the env file (Supabase → Project Settings → API).
 * Safe to re-run: existing users and cats are left alone.
 */
import { createClient } from "@supabase/supabase-js";
import { sampleCats } from "../src/lib/sample-data.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const email = process.argv[2] ?? "demo@brittanyniemirescues.test";
const password = process.argv[3] ?? "catsrule";
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1. Login
const { data: list } = await supabase.auth.admin.listUsers();
let user = list?.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
  console.log(`✓ Created login ${email}`);
} else {
  console.log(`• Login ${email} already exists`);
}
const { error: staffError } = await supabase.from("staff").upsert({ user_id: user.id });
if (staffError) throw staffError;
console.log("✓ Added as rescue staff");

// 2. Sample cats (only into an empty database)
const { count } = await supabase.from("cats").select("id", { count: "exact", head: true });
if (!count) {
  const rows = sampleCats.map(({ id: _id, cat_photos: _p, ...cat }) => cat);
  const { error } = await supabase.from("cats").insert(rows);
  if (error) throw error;
  console.log(`✓ Added ${rows.length} sample cats`);
} else {
  console.log(`• ${count} cats already in the database, skipped sample cats`);
}

console.log(`\nLog in at /admin with:\n  email:    ${email}\n  password: ${password}`);
