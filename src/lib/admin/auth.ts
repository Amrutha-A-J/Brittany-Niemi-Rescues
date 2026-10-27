import "server-only";
import { cookies } from "next/headers";
import { first, run } from "@/lib/db";
import { SESSION_COOKIE } from "./auth-cookie";

const SESSION_DAYS = 30;
const RESET_MINUTES = 60;

// PBKDF2 runs inside the Worker's CPU budget (10 ms on the free plan), so the
// count is modest. It's stored with each hash, so it can be raised later.
const ITERATIONS = 60_000;

const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes: Uint8Array) => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** "pbkdf2$<iterations>$<salt>$<hash>", all base64. */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await pbkdf2(password, salt, ITERATIONS))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const actual = await pbkdf2(password, unb64(salt), Number(iterations));
  const expected = unb64(hash);
  // Constant-time compare
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

/** Random token for a cookie or emailed link, and the hash that is stored instead of it. */
async function newToken() {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  return { token, hash: await tokenHash(token) };
}

async function tokenHash(token: string) {
  return b64(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(token))));
}

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

export type StaffUser = { id: string; email: string };

/** Logs a staff member in on this browser. */
export async function startSession(staffId: string) {
  const { token, hash } = await newToken();
  const expires = inMinutes(SESSION_DAYS * 24 * 60);
  await run("insert into sessions (token_hash, staff_id, expires_at) values (?, ?, ?)", hash, staffId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

/** The logged-in staff member, or null. */
export async function currentUser(): Promise<StaffUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return first<StaffUser>(
    `select s.id, s.email from sessions x join staff s on s.id = x.staff_id
     where x.token_hash = ? and x.expires_at > ?`,
    await tokenHash(token),
    new Date().toISOString(),
  );
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await run("delete from sessions where token_hash = ?", await tokenHash(token));
  store.delete(SESSION_COOKIE);
}

/** Signs out every other browser, e.g. after a password change. */
export async function endOtherSessions(staffId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await run(
    "delete from sessions where staff_id = ? and (token_hash != ? or expires_at <= ?)",
    staffId,
    token ? await tokenHash(token) : "",
    new Date().toISOString(),
  );
}

/** Makes a one-hour password reset token for an emailed link. */
export async function createResetToken(staffId: string) {
  const { token, hash } = await newToken();
  await run("insert into password_resets (token_hash, staff_id, expires_at) values (?, ?, ?)", hash, staffId, inMinutes(RESET_MINUTES));
  return token;
}

/** Uses up a reset token and returns whose it was, if it's still valid. */
export async function consumeResetToken(token: string) {
  const hash = await tokenHash(token);
  const row = await first<{ staff_id: string; expires_at: string }>(
    "delete from password_resets where token_hash = ? returning staff_id, expires_at",
    hash,
  );
  return row && row.expires_at > new Date().toISOString() ? row.staff_id : null;
}
