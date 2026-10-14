import { DemoOverview } from "@/components/demo/DemoAdmin";
import { isDemo } from "@/lib/demo/config";
import Link from "next/link";
import { ServerMeetingList as MeetingList } from "@/components/admin/ServerMeetingList";
import { Card, Empty, PageHeader } from "@/components/admin/ui";
import { MEETING_SELECT, type MeetingRow } from "@/lib/admin/meetings";
import { requireStaff } from "@/lib/admin/session";
import { formatDate } from "@/lib/calendar";
import { applicationTypeLabel } from "@/lib/forms";
import type { ApplicationType } from "@/lib/types";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  if (isDemo) return <DemoOverview />;
  const { supabase } = await requireStaff();
  const today = new Date().toISOString().slice(0, 10);
  const [cats, apps, meetings, followUps] = await Promise.all([
    supabase.from("cats").select("status"),
    supabase
      .from("applications")
      .select("id, name, type, created_at, cats(name)")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("meetings")
      .select(MEETING_SELECT)
      .eq("status", "scheduled")
      .gte("starts_at", new Date(nowMs() - 3 * 3600_000).toISOString())
      .order("starts_at")
      .limit(5),
    supabase.from("adoptions").select("cat_id, adopter_name, follow_up_on, cats(name)").lte("follow_up_on", today).limit(5),
  ]);

  const count = (s: string) => (cats.data ?? []).filter((c) => c.status === s).length;
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
                const cat = (Array.isArray(a.cats) ? a.cats[0] : a.cats) as { name: string } | null;
                return (
                  <li key={a.id}>
                    <Link href={`/admin/applications/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:underline">
                      <span>
                        <span className="font-medium">{a.name}</span>
                        <span className="text-sm text-muted">
                          {" "}
                          · {applicationTypeLabel[a.type as ApplicationType]}
                          {cat ? ` for ${cat.name}` : ""}
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
          {meetings.data?.length ? <MeetingList meetings={meetings.data as MeetingRow[]} /> : <Empty>Nothing scheduled.</Empty>}
        </Card>
        {followUps.data && followUps.data.length > 0 && (
          <Card title="Adoption follow-ups due">
            <ul className="divide-y divide-line">
              {followUps.data.map((f) => {
                const cat = (Array.isArray(f.cats) ? f.cats[0] : f.cats) as { name: string } | null;
                return (
                  <li key={f.cat_id}>
                    <Link href={`/admin/adopted/${f.cat_id}`} className="flex justify-between gap-3 py-3 hover:underline">
                      <span>
                        {cat?.name} <span className="text-muted">with {f.adopter_name}</span>
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
