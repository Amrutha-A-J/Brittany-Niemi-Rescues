import { DemoLogin } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { ActionForm, PasswordInput, SubmitButton } from "@/components/admin/Forms";
import { login } from "@/lib/admin/auth-actions";
import { currentUser } from "@/lib/admin/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (isDemo) return <DemoLogin />;
  const { next, error } = await searchParams;

  if (await currentUser()) redirect("/admin");

  return (
    <AuthCard title="Rescue login">
      {error === "link" && (
        <p className="mb-4 rounded-xl bg-card px-3.5 py-2.5 text-sm">
          That link has expired or was already used. Request a new one below.
        </p>
      )}
      <ActionForm action={login}>
        <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />
        <label className="block">
          <span className="field-label">Email</span>
          <input name="email" type="email" autoComplete="email" required className="field" />
        </label>
        <label className="block">
          <span className="field-label">Password</span>
          <PasswordInput name="password" autoComplete="current-password" required />
        </label>
        <SubmitButton pendingText="Logging in…" className="btn-primary w-full">
          Log in
        </SubmitButton>
      </ActionForm>
      <Link href="/admin/forgot-password" className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
        Forgot password?
      </Link>
    </AuthCard>
  );
}
