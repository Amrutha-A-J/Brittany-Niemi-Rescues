import { DemoMeetings } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import { ServerMeetingList as MeetingList } from "@/components/admin/ServerMeetingList";
import { Card, Empty, PageHeader } from "@/components/admin/ui";
import type { MeetingRow } from "@/lib/admin/meetings";
import { requireStaff } from "@/lib/admin/session";
import { MEETING_SQL, all, toMeeting } from "@/lib/db";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Meet & greets" };

export default async function MeetingsPage() {
  if (isDemo) return <DemoMeetings />;
  await requireStaff();
  const since = new Date(nowMs() - 3 * 3600_000).toISOString();
  const [upcoming, past] = await Promise.all([
    all(`${MEETING_SQL} where m.status = 'scheduled' and m.starts_at >= ? order by m.starts_at`, since).then((r) => r.map(toMeeting) as MeetingRow[]),
    all(`${MEETING_SQL} where m.starts_at < ? or m.status != 'scheduled' order by m.starts_at desc limit 50`, since).then(
      (r) => r.map(toMeeting) as MeetingRow[],
    ),
  ]);

  return (
    <>
      <PageHeader
        title="Meet & greets"
        description="Schedule them from an application. Each one has calendar links for you and an emailed invite for the applicant."
      />
      <div className="space-y-6">
        <Card title="Upcoming">
          {upcoming?.length ? <MeetingList meetings={upcoming} /> : <Empty>Nothing scheduled.</Empty>}
        </Card>
        <Card title="Past & cancelled">
          {past?.length ? <MeetingList meetings={past} /> : <p className="text-sm text-muted">None yet.</p>}
        </Card>
      </div>
    </>
  );
}
