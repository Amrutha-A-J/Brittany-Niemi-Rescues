import { DemoAccount } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { ActionForm, PasswordInput, SubmitButton } from "@/components/admin/Forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { updatePassword } from "@/lib/admin/auth-actions";
import { saveNotifyEmail } from "@/lib/admin/settings-actions";
import { getSettings } from "@/lib/settings";
import { requireStaff } from "@/lib/admin/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  if (isDemo) return <DemoAccount />;
  const [{ user }, settings] = await Promise.all([requireStaff(), getSettings()]);
  return (
    <>
      <PageHeader title="Account" description={`Logged in as ${user.email}`} />
      <div className="max-w-md space-y-6">
        <Card title="Email notifications">
          <ActionForm action={saveNotifyEmail}>
            <label className="block">
              <span className="field-label">Send new applications to</span>
              <input type="email" name="notify_email" className="field" defaultValue={settings.notifyEmail} autoComplete="email" />
              <span className="field-hint">
                You get an email here for every adoption or foster application, and a calendar invite for every meet &amp;
                greet you schedule.
              </span>
            </label>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </Card>
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
