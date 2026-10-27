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

/** The applicant's calendar entry: no contact details, just what the invite email says. */
export function inviteEvent(e: { id: string; start: Date; minutes: number; location: string; notes: string; mapUrl: string; who: string; catNames: string }) {
  return {
    uid: e.id,
    title: `Meet & greet with ${e.who} (${site.name})`,
    start: e.start,
    minutes: e.minutes,
    location: e.location,
    description: [`Meet & greet with ${site.name}${e.catNames ? ` to meet ${e.catNames}` : ""}.`, e.notes, e.mapUrl && `Map: ${e.mapUrl}`]
      .filter(Boolean)
      .join("\n\n"),
  };
}

/** The applicant's calendar entry for a saved meeting (see /calendar/<id>.ics). */
export function meetingInviteEvent(m: MeetingRow) {
  const catNames = m.applications?.cats?.name ?? "";
  return inviteEvent({
    id: m.id,
    start: new Date(m.starts_at),
    minutes: m.duration_minutes,
    location: m.location,
    notes: m.notes,
    mapUrl: m.map_url ?? "",
    who: catNames || (m.applications?.type === "foster" ? "our foster team" : "our cats"),
    catNames,
  });
}

/** Public link to the applicant's calendar file. Apple Calendar opens it directly. */
export const inviteIcsUrl = (meetingId: string) => `${site.url}/calendar/${meetingId}.ics`;

/** The rescue's calendar entry, with the applicant's contact details. */
export function meetingEvent(m: MeetingRow) {
  const app = m.applications;
  const catName = app?.cats?.name;
  return {
    uid: `${m.id}-rescue`,
    title: `Meet & greet: ${app?.name ?? "applicant"}${catName ? ` + ${catName}` : ""}`,
    start: new Date(m.starts_at),
    minutes: m.duration_minutes,
    location: m.location,
    description: [
      app ? `${app.name} · ${app.phone} · ${app.email}` : "",
      catName ? `Cats: ${catName}` : "",
      m.notes,
      m.map_url ? `Map: ${m.map_url}` : "",
      app ? `${site.url}/admin/applications/${app.id}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export const meetingGoogleUrl = (m: MeetingRow) => googleCalendarUrl(meetingEvent(m));
