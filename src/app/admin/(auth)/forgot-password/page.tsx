import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { ActionForm, SubmitButton } from "@/components/admin/Forms";
import { requestPasswordReset } from "@/lib/admin/auth-actions";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password">
      <p className="mb-5 text-sm leading-relaxed text-muted">
        Enter the email you log in with and we&apos;ll send you a link to choose a new password.
      </p>
      <ActionForm action={requestPasswordReset}>
        <label className="block">
          <span className="field-label">Email</span>
          <input name="email" type="email" autoComplete="email" required className="field" />
        </label>
        <SubmitButton pendingText="Sending…" className="btn-primary w-full">
          Send reset link
        </SubmitButton>
      </ActionForm>
      <Link href="/admin/login" className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
        ← Back to login
      </Link>
    </AuthCard>
  );
}
