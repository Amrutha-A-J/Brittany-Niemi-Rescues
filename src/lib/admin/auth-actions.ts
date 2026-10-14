"use server";

import { redirect } from "next/navigation";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "./session";

export type FormState = { ok?: boolean; error?: string; message?: string };

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "That email and password don't match. Try again or reset your password." };
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site.url}/auth/confirm?next=/admin/reset-password`,
  });
  if (error) console.error("[password reset]", error.message);
  // Same message either way, so the form can't be used to discover accounts.
  return { ok: true, message: "If that email has an account, a reset link is on its way. Check your inbox (and spam)." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error:
        error.message.includes("session") || error.status === 401
          ? "Your reset link has expired. Request a new one."
          : error.message,
    };
  }
  return { ok: true, message: "Password updated." };
}
