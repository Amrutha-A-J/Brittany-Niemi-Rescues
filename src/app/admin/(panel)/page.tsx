import { DemoOverview } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { ServerMeetingList as MeetingList } from "@/components/admin/ServerMeetingList";
import { Card, Empty, PageHeader } from "@/components/admin/ui";
import type { MeetingRow } from "@/lib/admin/meetings";
import { requireStaff } from "@/lib/admin/session";
import { formatDate } from "@/lib/calendar";
import { MEETING_SQL, all, toMeeting } from "@/lib/db";
import { applicationTypeLabel } from "@/lib/forms";
import type { ApplicationType } from "@/lib/types";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  if (isDemo) return <DemoOverview />;
  await requireStaff();
  const today = new Date().toISOString().slice(0, 10);
  const [cats, newApps, upcoming, followUps] = await Promise.all([
    all<{ status: string }>("select status from cats"),
    all<{ id: string; name: string; type: string; created_at: string; cat_name: string | null }>(
      `select a.id, a.name, a.type, a.created_at, c.name as cat_name
       from applications a left join cats c on c.id = a.cat_id
       where a.status = 'new' order by a.created_at desc limit 50`,
    ),
    all(`${MEETING_SQL} where m.status = 'scheduled' and m.starts_at >= ? order by m.starts_at limit 5`, new Date(nowMs() - 3 * 3600_000).toISOString()),
    all<{ cat_id: string; adopter_name: string; follow_up_on: string | null; cat_name: string | null }>(
      `select d.cat_id, d.adopter_name, d.follow_up_on, c.name as cat_name
       from adoptions d join cats c on c.id = d.cat_id where d.follow_up_on <= ? limit 5`,
      today,
    ),
  ]);
  const apps = { data: newApps };
  const meetings = { data: upcoming.map(toMeeting) as MeetingRow[] };

  const count = (s: string) => cats.filter((c) => c.status === s).length;
  const stats = [
    { label: "Available cats", value: count("available"), href: "/admin/cats" },
    { label: "Adoption pending", value: count("pending"), href: "/admin/cats" },
    {
      label: "New adoption applications",
      value: (apps.data ?? []).filter((a) => a.type === "adopt").length,
      href: "/admin/applications/adopt",
    },
    {
      label: "New foster applications",
      value: (apps.data ?? []).filter((a) => a.type === "foster").length,
      href: "/admin/applications/foster",
    },
    { label: "Upcoming meet & greets", value: meetings.data?.length ?? 0, href: "/admin/meetings" },
  ];

  return (
    <>
      <PageHeader
        title="Hello!"
        description="Here's what's happening at the rescue."
        actions={
          <Link href="/admin/cats/new" className="btn-primary">
            + Add a cat
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-white p-5 hover:border-ink">
            <p className="font-serif text-4xl leading-none">{s.value}</p>
            <p className="mt-2 text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="New applications">
          {apps.data?.length ? (
            <ul className="divide-y divide-line">
              {apps.data.slice(0, 6).map((a) => {
                return (
                  <li key={a.id}>
                    <Link href={`/admin/applications/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:underline">
                      <span>
                        <span className="font-medium">{a.name}</span>
                        <span className="text-sm text-muted">
                          {" "}
                          · {applicationTypeLabel[a.type as ApplicationType]}
                          {a.cat_name ? ` for ${a.cat_name}` : ""}
                        </span>
                      </span>
                      <span className="text-xs text-muted">{formatDate(a.created_at)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>You&apos;re all caught up.</Empty>
          )}
        </Card>
        <Card title="Upcoming meet & greets">
          {meetings.data?.length ? <MeetingList meetings={meetings.data} /> : <Empty>Nothing scheduled.</Empty>}
        </Card>
        {followUps.length > 0 && (
          <Card title="Adoption follow-ups due">
            <ul className="divide-y divide-line">
              {followUps.map((f) => {
                return (
                  <li key={f.cat_id}>
                    <Link href={`/admin/adopted/${f.cat_id}`} className="flex justify-between gap-3 py-3 hover:underline">
                      <span>
                        {f.cat_name} <span className="text-muted">with {f.adopter_name}</span>
                      </span>
                      <span className="text-xs text-muted">{f.follow_up_on && formatDate(f.follow_up_on)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
