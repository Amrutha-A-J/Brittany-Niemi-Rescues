import { site } from "./site";

/** `<input type="datetime-local">` value (rescue's local time) → Date. */
export function parseLocalDateTime(value: string) {
  return new Date(`${value}:00${site.utcOffset}`);
}

/** Date → `<input type="datetime-local">` value in the rescue's time zone. */
export function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: site.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: site.timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(isoOrDate: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? new Date(`${isoOrDate}T12:00:00${site.utcOffset}`) : new Date(isoOrDate);
  return new Intl.DateTimeFormat("en-CA", { timeZone: site.timeZone, year: "numeric", month: "short", day: "numeric" }).format(d);
}

type CalEvent = { uid: string; title: string; start: Date; minutes: number; description: string; location: string };

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(e: CalEvent) {
  const end = new Date(e.start.getTime() + e.minutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(end)}`,
    details: e.description,
    location: e.location,
    ctz: site.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** An .ics file that Apple Calendar, Outlook and Google can all import. */
export function icsFile(e: CalEvent) {
  const end = new Date(e.start.getTime() + e.minutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Meet and greet//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@${new URL(site.url).hostname}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `DESCRIPTION:${icsEscape(e.description)}`,
    `LOCATION:${icsEscape(e.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
