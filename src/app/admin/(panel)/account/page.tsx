import { DemoAccount } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { ActionForm, PasswordInput, SubmitButton } from "@/components/admin/Forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { updatePassword } from "@/lib/admin/auth-actions";
import { requireStaff } from "@/lib/admin/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  if (isDemo) return <DemoAccount />;
  const { user } = await requireStaff();
  return (
    <>
      <PageHeader title="Account" description={`Logged in as ${user.email}`} />
      <div className="max-w-md space-y-6">
        <Card title="Change password">
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
            <SubmitButton>Update password</SubmitButton>
          </ActionForm>
        </Card>
        <p className="text-sm text-muted">
          Forgot it while logged out? Use{" "}
          <Link href="/admin/forgot-password" className="underline">
            Forgot password
          </Link>{" "}
          on the login page.
        </p>
      </div>
    </>
  );
}
