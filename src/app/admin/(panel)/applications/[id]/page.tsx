import { DemoApplication } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationActions } from "@/components/admin/ApplicationActions";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/Forms";
import { ServerMeetingList as MeetingList } from "@/components/admin/ServerMeetingList";
import { ApplicationStatusBadge, Card, PageHeader } from "@/components/admin/ui";
import { deleteApplication, reopenApplication, saveNotes } from "@/lib/admin/application-actions";
import { MEETING_SELECT, type MeetingRow } from "@/lib/admin/meetings";
import { requireStaff } from "@/lib/admin/session";
import { formatDate, toLocalInputValue } from "@/lib/calendar";
import { applicationListMeta } from "@/lib/admin/application-tabs";
import { applicationFields, applicationTypeLabel } from "@/lib/forms";
import type { Application } from "@/lib/types";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Application" };

/** The static demo has one page per screen; the record id comes from `?id=`. */
export async function generateStaticParams() {
  return isDemo ? [{ id: "_" }] : [];
}

export default async function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  const { id } = await params;
  if (isDemo) return <DemoApplication id={id} />;
  const { supabase } = await requireStaff();
  const [{ data }, { data: meetings }] = await Promise.all([
    supabase.from("applications").select("*, cats(id, name, slug, status)").eq("id", id).maybeSingle(),
    supabase.from("meetings").select(MEETING_SELECT).eq("application_id", id).order("starts_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const app = data as Application & { cats: { id: string; name: string; slug: string; status: string } | null };

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
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

          {meetings && meetings.length > 0 && (
            <Card title="Meet & greets">
              <MeetingList meetings={meetings as MeetingRow[]} showApplicant={false} />
            </Card>
          )}

          <Card title="Their answers">
            <dl className="space-y-5">
              {applicationFields[app.type]
                .filter((f) => app.answers[f.name] !== undefined)
                .map((f) => {
                  const v = app.answers[f.name];
                  const value = Array.isArray(v) ? v.join(", ") : v;
                  return (
                    <div key={f.name}>
                      <dt className="text-xs text-muted">{f.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-[15px]">{value || "—"}</dd>
                    </div>
                  );
                })}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd>
                  <a href={`mailto:${app.email}`} className="underline underline-offset-2">
                    {app.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd>
                  <a href={`tel:${app.phone}`} className="underline underline-offset-2">
                    {app.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Town or city</dt>
                <dd>{app.city}</dd>
              </div>
              {app.type === "adopt" && (
                <div>
                  <dt className="text-xs text-muted">Cat</dt>
                  <dd>
                    {app.cats ? (
                      <Link href={`/admin/cats/${app.cats.id}`} className="underline underline-offset-2">
                        {app.cats.name}
                      </Link>
                    ) : (
                      "No specific cat"
                    )}
                  </dd>
                </div>
              )}
            </dl>
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
