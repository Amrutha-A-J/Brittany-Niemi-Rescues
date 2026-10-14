import { DemoMeetings } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import { ServerMeetingList as MeetingList } from "@/components/admin/ServerMeetingList";
import { Card, Empty, PageHeader } from "@/components/admin/ui";
import { MEETING_SELECT, type MeetingRow } from "@/lib/admin/meetings";
import { requireStaff } from "@/lib/admin/session";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Meet & greets" };

export default async function MeetingsPage() {
  if (isDemo) return <DemoMeetings />;
  const { supabase } = await requireStaff();
  const since = new Date(nowMs() - 3 * 3600_000).toISOString();
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.from("meetings").select(MEETING_SELECT).eq("status", "scheduled").gte("starts_at", since).order("starts_at"),
    supabase.from("meetings").select(MEETING_SELECT).or(`starts_at.lt.${since},status.neq.scheduled`).order("starts_at", { ascending: false }).limit(50),
  ]);

  return (
    <>
      <PageHeader
        title="Meet & greets"
        description="Schedule them from an application. Each one has calendar links for you and an emailed invite for the applicant."
      />
      <div className="space-y-6">
        <Card title="Upcoming">
          {upcoming?.length ? <MeetingList meetings={upcoming as MeetingRow[]} /> : <Empty>Nothing scheduled.</Empty>}
        </Card>
        <Card title="Past & cancelled">
          {past?.length ? <MeetingList meetings={past as MeetingRow[]} /> : <p className="text-sm text-muted">None yet.</p>}
        </Card>
      </div>
    </>
  );
}
