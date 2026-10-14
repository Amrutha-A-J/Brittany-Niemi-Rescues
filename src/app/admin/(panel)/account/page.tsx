import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/Forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { updatePassword } from "@/lib/admin/auth-actions";
import { requireStaff } from "@/lib/admin/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const { user } = await requireStaff();
  return (
    <>
      <PageHeader title="Account" description={`Logged in as ${user.email}`} />
      <div className="max-w-md space-y-6">
        <Card title="Change password">
          <ActionForm action={updatePassword}>
            <label className="block">
              <span className="field-label">New password</span>
              <input name="password" type="password" autoComplete="new-password" minLength={8} required className="field" />
              <span className="field-hint">At least 8 characters.</span>
            </label>
            <label className="block">
              <span className="field-label">Type it again</span>
              <input name="confirm" type="password" autoComplete="new-password" required className="field" />
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
