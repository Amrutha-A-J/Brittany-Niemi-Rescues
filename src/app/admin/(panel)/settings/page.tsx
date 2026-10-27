import { DemoSettings } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import { ActionForm, SubmitButton } from "@/components/admin/Forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { saveSiteText } from "@/lib/admin/site-text-actions";
import { requireStaff } from "@/lib/admin/session";
import { getSiteText, siteTextDefaults } from "@/lib/site-text";

export const metadata = { title: "Website settings" };

export default async function SettingsPage() {
  if (isDemo) return <DemoSettings />;
  await requireStaff();
  const text = await getSiteText();
  return (
    <>
      <PageHeader title="Website settings" description="Change the wording on the website." />
      <Card title="Home page hero" className="max-w-2xl">
        <ActionForm action={saveSiteText}>
          <label className="block">
            <span className="field-label">Headline</span>
            <textarea name="heroHeading" rows={2} defaultValue={text.heroHeading} required className="field" />
            <span className="field-hint">
              Press Enter to start a new line. Put *stars* around words to make them italic, like *soft place*.
            </span>
          </label>
          <label className="block">
            <span className="field-label">Intro</span>
            <textarea name="heroIntro" rows={4} defaultValue={text.heroIntro} required className="field" />
            <span className="field-hint">The short paragraph under the headline.</span>
          </label>
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </Card>
      <details className="mt-6 max-w-2xl text-sm text-muted">
        <summary className="cursor-pointer">Original wording</summary>
        <p className="mt-2 whitespace-pre-line">{siteTextDefaults.heroHeading}</p>
        <p className="mt-2">{siteTextDefaults.heroIntro}</p>
      </details>
    </>
  );
}
