import { DemoForgotPassword } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { ActionForm, PasswordInput, SubmitButton } from "@/components/admin/Forms";
import { updatePassword } from "@/lib/admin/auth-actions";

export const metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  if (isDemo) return <DemoForgotPassword />;
  return (
    <AuthCard title="Choose a new password">
      <ActionForm action={updatePassword}>
        <label className="block">
          <span className="field-label">New password</span>
          <PasswordInput name="password" autoComplete="new-password" minLength={8} required />
          <span className="field-hint">At least 8 characters.</span>
        </label>
        <label className="block">
          <span className="field-label">Type it again</span>
          <PasswordInput name="confirm" autoComplete="new-password" required />
        </label>
        <SubmitButton className="btn-primary w-full">Save password</SubmitButton>
      </ActionForm>
      <Link href="/admin" className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
        Go to the dashboard →
      </Link>
    </AuthCard>
  );
}
