"use server";

import { redirect } from "next/navigation";
import { first, run } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { createResetToken, endOtherSessions, endSession, hashPassword, startSession, verifyPassword } from "./auth";
import { requireStaff, safeNext } from "./session";

export type FormState = { ok?: boolean; error?: string; message?: string };

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const staff = await first<{ id: string; password_hash: string }>("select id, password_hash from staff where email = ?", email);
  if (!staff || !(await verifyPassword(password, staff.password_hash))) {
    return { error: "That email and password don't match. Try again or reset your password." };
  }
  await startSession(staff.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
  const staff = await first<{ id: string; email: string }>("select id, email from staff where email = ?", email);
  if (staff) {
    const token = await createResetToken(staff.id);
    // Brevo template #1 ("Reset password"): its button links to {{ params.link }}. The link works once, for one hour.
    const res = await sendEmail({
      to: { email: staff.email },
      templateId: 1,
      params: { link: `${site.url}/auth/confirm?token=${token}` },
    });
    if (!res.ok) console.error("[password reset] email not sent");
  }
  // Same message either way, so the form can't be used to discover accounts.
  return { ok: true, message: "If that email has an account, a reset link is on its way. Check your inbox (and spam)." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const { user } = await requireStaff();
  await run("update staff set password_hash = ? where id = ?", await hashPassword(password), user.id);
  await endOtherSessions(user.id);
  return { ok: true, message: "Password updated." };
}
