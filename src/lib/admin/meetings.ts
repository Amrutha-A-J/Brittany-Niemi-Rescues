import { googleCalendarUrl } from "@/lib/calendar";
import { site } from "@/lib/site";
import type { Meeting } from "@/lib/types";

export type MeetingRow = Meeting & {
  applications: {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: string;
    status: string;
    cats: { name: string; slug: string } | null;
  } | null;
};

export function meetingEvent(m: MeetingRow) {
  const app = m.applications;
  const catName = app?.cats?.name;
  return {
    uid: m.id,
    title: `Meet & greet: ${app?.name ?? "applicant"}${catName ? ` + ${catName}` : ""}`,
    start: new Date(m.starts_at),
    minutes: m.duration_minutes,
    location: m.location,
    description: [
      app ? `${app.name} · ${app.phone} · ${app.email}` : "",
      catName ? `Cat: ${catName}` : "",
      m.notes,
      app ? `${site.url}/admin/applications/${app.id}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export const meetingGoogleUrl = (m: MeetingRow) => googleCalendarUrl(meetingEvent(m));
