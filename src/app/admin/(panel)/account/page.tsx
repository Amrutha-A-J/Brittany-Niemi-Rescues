import { DemoAccount } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { ActionForm, PasswordInput, SubmitButton } from "@/components/admin/Forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { updatePassword } from "@/lib/admin/auth-actions";
import { saveSettings } from "@/lib/admin/settings-actions";
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
          <ActionForm action={saveSettings}>
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
        <Card title="Meet &amp; greets">
          <ActionForm action={saveSettings}>
            <label className="block">
              <span className="field-label">Usual place</span>
              <input name="meet_location" className="field" defaultValue={settings.meetLocation} placeholder="e.g. Brittany's home, north Regina" />
              <span className="field-hint">Filled in for you when you schedule a meet &amp; greet. You can still change it each time.</span>
            </label>
            <label className="block">
              <span className="field-label">Map link</span>
              <input type="url" name="meet_map_url" className="field" defaultValue={settings.meetMapUrl} placeholder="https://www.google.com/maps?q=…" />
              <span className="field-hint">
                In Google Maps, drop a pin, tap Share and paste the link here. The invite gets an &ldquo;Open in Maps&rdquo;
                button.
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
