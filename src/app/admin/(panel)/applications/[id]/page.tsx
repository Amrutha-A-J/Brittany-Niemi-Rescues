import { DemoApplication } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationActions } from "@/components/admin/ApplicationActions";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/Forms";
import { ServerMeetingList as MeetingList } from "@/components/admin/ServerMeetingList";
import { ApplicationSummary } from "@/components/admin/ApplicationSummary";
import { ApplicationStatusBadge, Card, PageHeader } from "@/components/admin/ui";
import { deleteApplication, reopenApplication, saveNotes } from "@/lib/admin/application-actions";
import type { MeetingRow } from "@/lib/admin/meetings";
import { requireStaff } from "@/lib/admin/session";
import { formatDate, toLocalInputValue } from "@/lib/calendar";
import { MEETING_SQL, all, first, nested, toApplication, toMeeting } from "@/lib/db";
import { applicationListMeta } from "@/lib/admin/application-tabs";
import { applicationTypeLabel } from "@/lib/forms";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Application" };

/**
 * The static demo has one page per screen; the record id comes from `?id=`.
 * Only the demo defines this: with it, the live site would treat the page as static
 * and fail when the login check reads the session cookie.
 */
export const generateStaticParams = isDemo ? async () => [{ id: "_" }] : undefined;

export default async function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  const { id } = await params;
  if (isDemo) return <DemoApplication id={id} />;
  await requireStaff();
  const [data, meetingRows] = await Promise.all([
    first(
      `select a.*, json(case when c.id is null then null else json_object('id', c.id, 'name', c.name, 'slug', c.slug, 'status', c.status) end) as cats
       from applications a left join cats c on c.id = a.cat_id where a.id = ?`,
      id,
    ),
    all(`${MEETING_SQL} where m.application_id = ? order by m.starts_at desc`, id),
  ]);
  if (!data) notFound();
  const app = { ...toApplication(data), cats: nested<{ id: string; name: string; slug: string; status: string }>(data.cats) };
  const meetings = meetingRows.map(toMeeting) as MeetingRow[];

  // Default meet & greet: two days from now at 6pm.
  const d = new Date(nowMs() + 2 * 86_400_000);
  const defaultWhen = `${toLocalInputValue(d.toISOString()).slice(0, 10)}T18:00`;

  return (
    <>
      <PageHeader
        title={app.name}
        back={{ href: applicationListMeta[app.type].href, label: applicationListMeta[app.type].title }}
        description={
          <>
            {applicationTypeLabel[app.type]} application · received {formatDate(app.created_at)}
          </>
        }
        actions={<ApplicationStatusBadge status={app.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-6">
          <ApplicationSummary app={app} cat={
              app.cats ? (
                <Link href={`/admin/cats/${app.cats.id}`} className="underline underline-offset-2">
                  {app.cats.name}
                </Link>
              ) : app.type === "adopt" ? (
                "No specific cat"
              ) : (
                "Open to any cat"
              )
            } />
          {meetings && meetings.length > 0 && (
            <Card title="Meet & greets">
              <MeetingList meetings={meetings} showApplicant={false} />
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Next step">
            <ApplicationActions
              id={app.id}
              firstName={app.name.split(" ")[0]}
              catName={app.cats?.name ?? null}
              catAvailable={app.cats?.status === "available"}
              type={app.type}
              defaultWhen={defaultWhen}
            />
            {(app.status === "approved" || app.status === "rejected") && (
              <form action={reopenApplication} className="mt-4 border-t border-line pt-4">
                <input type="hidden" name="id" value={app.id} />
                <button className="text-sm text-muted underline underline-offset-2 hover:text-ink">Move back to New</button>
              </form>
            )}
            {app.status === "approved" && app.cats && app.cats.status !== "adopted" && (
              <Link href={`/admin/cats/${app.cats.id}/adopt?application=${app.id}`} className="btn-primary mt-4">
                Finalise adoption of {app.cats.name} →
              </Link>
            )}
          </Card>
          <Card title="Private notes">
            <ActionForm action={saveNotes}>
              <input type="hidden" name="id" value={app.id} />
              <textarea name="notes" rows={6} className="field" defaultValue={app.admin_notes} placeholder="Only visible to rescue staff." />
              <SubmitButton className="btn-outline">Save notes</SubmitButton>
            </ActionForm>
          </Card>
          <form action={deleteApplication}>
            <input type="hidden" name="id" value={app.id} />
            <ConfirmSubmit message="Delete this application permanently?" className="text-sm text-danger underline underline-offset-2">
              Delete application
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}
