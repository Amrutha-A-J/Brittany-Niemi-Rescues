"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { googleCalendarUrl, icsFile, outlookCalendarUrl, parseLocalDateTime, formatDateTime } from "@/lib/calendar";
import { namesList } from "@/lib/cats";
import { button, emailLayout, escapeHtml, rescueInbox, sendEmail, sendTemplate, textToHtml } from "@/lib/email";
import { APP_CATS_SQL, appCats, first, insertSql, newId, nowIso, run, toApplication } from "@/lib/db";
import { site } from "@/lib/site";
import type { FormState } from "./auth-actions";
import { ensureFosterFromApplication } from "./fosters-db";
import { inviteEvent, inviteIcsUrl } from "./meetings";
import { assertStaff } from "./session";

const on = (fd: FormData, name: string) => fd.get(name) === "on";
const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();

async function loadApplication(id: string) {
  await assertStaff();
  const row = await first(
    `select a.id, a.type, a.status, a.name, a.email, a.phone, a.city, a.answers, a.cat_id, ${APP_CATS_SQL}
     from applications a where a.id = ?`,
    id,
  );
  if (!row) throw new Error("Application not found");
  const cats = appCats(row.cats);
  return { app: toApplication(row), cats, catNames: namesList(cats.map((c) => c.name)) };
}

function refresh(id?: string) {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/applications/${id}`);
}

export async function saveNotes(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertStaff();
  await run("update applications set admin_notes = ? where id = ?", text(fd, "notes"), text(fd, "id"));
  refresh(text(fd, "id"));
  return { message: "Notes saved." };
}

export async function approveApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const { app, cats, catNames } = await loadApplication(id);
  await run("update applications set status = 'approved', decided_at = ? where id = ?", nowIso(), id);

  const available = cats.filter((c) => c.status === "available");
  if (available.length && on(fd, "mark_pending")) {
    for (const c of available) {
      await run("update cats set status = 'pending' where id = ?", c.id);
      revalidatePath(`/cats/${c.slug}`);
    }
    revalidatePath("/");
    revalidatePath("/adopt");
  }

  let fosterNote = "";
  if (app.type === "foster" && on(fd, "add_to_fosters")) {
    await ensureFosterFromApplication(app);
    revalidatePath("/admin/fosters");
    fosterNote = " Added to Fosters.";
  }

  let emailNote = "";
  if (on(fd, "send_email")) {
    const message = text(fd, "message");
    const inbox = await rescueInbox();
    const res = await sendEmail({
      to: { email: app.email, name: app.name },
      replyTo: inbox ? { email: inbox } : undefined,
      subject: app.type === "adopt" ? `Good news about ${catNames || "your application"}!` : "Welcome to the foster team!",
      html: emailLayout(`<p>Hi ${escapeHtml(app.name.split(" ")[0])},</p>${textToHtml(message)}<p>${escapeHtml(site.name)}</p>`),
    });
    emailNote = res.ok ? " Email sent." : res.skipped ? " (Email not sent: email isn't set up yet.)" : " The email failed to send.";
  }
  refresh(id);
  return { message: `Approved.${fosterNote}${emailNote}` };
}

export async function rejectApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const { app } = await loadApplication(id);
  await run("update applications set status = 'rejected', decided_at = ? where id = ?", nowIso(), id);

  let emailNote = "";
  if (on(fd, "send_email")) {
    const inbox = await rescueInbox();
    const res = await sendEmail({
      to: { email: app.email, name: app.name },
      replyTo: inbox ? { email: inbox } : undefined,
      subject: "About your application",
      html: emailLayout(
        `<p>Hi ${escapeHtml(app.name.split(" ")[0])},</p>${textToHtml(text(fd, "message"))}<p>${escapeHtml(site.name)}</p>`,
      ),
    });
    emailNote = res.ok ? " Email sent." : res.skipped ? " (Email not sent: email isn't set up yet.)" : " The email failed to send.";
  }
  refresh(id);
  return { message: `Marked as not a match.${emailNote}` };
}

export async function reopenApplication(fd: FormData) {
  await assertStaff();
  const id = text(fd, "id");
  await run("update applications set status = 'new', decided_at = null where id = ?", id);
  refresh(id);
}

export async function deleteApplication(fd: FormData) {
  await assertStaff();
  const data = await first<{ type: string }>("delete from applications where id = ? returning type", text(fd, "id"));
  refresh();
  redirect(data?.type === "foster" ? "/admin/applications/foster" : "/admin/applications/adopt");
}

export async function scheduleMeeting(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const when = text(fd, "when");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) return { error: "Choose a date and time." };
  const start = parseLocalDateTime(when);
  const minutes = Math.min(240, Math.max(15, Number(fd.get("duration")) || 60));
  const location = text(fd, "location");
  // A link typed as the place doubles as the map; otherwise search Maps for the place.
  const mapUrl =
    text(fd, "map_url") ||
    (/^https?:\/\//.test(location) ? location : location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : "");
  const notes = text(fd, "notes");

  const { app, catNames } = await loadApplication(id);
  const meeting = { id: newId() };
  await run(
    ...insertSql("meetings", {
      id: meeting.id,
      application_id: id,
      starts_at: start.toISOString(),
      duration_minutes: minutes,
      location,
      map_url: mapUrl,
      notes,
    }),
  );
  if (app.status === "new") {
    await run("update applications set status = 'meet_scheduled' where id = ?", id);
  }

  const who = catNames || (app.type === "foster" ? "our foster team" : "our cats");
  const whenText = formatDateTime(start.toISOString());
  const isLink = /^https?:\/\//.test(location);
  const where = isLink ? "Tap “Open in Maps” for directions" : location || "Location to be confirmed";
  const ics = (e: Parameters<typeof icsFile>[0]) => [{ name: "meet-and-greet.ics", content: Buffer.from(icsFile(e)).toString("base64") }];

  // The applicant's calendar entry.
  const invite = inviteEvent({ id: meeting.id, start, minutes, location, notes, mapUrl, who, catNames });
  // The rescue's calendar entry, with the applicant's contact details.
  const booked = {
    ...invite,
    uid: `${meeting.id}-rescue`,
    title: `Meet & greet: ${app.name}${catNames ? ` + ${catNames}` : ""}`,
    description: [`${app.name} · ${app.phone} · ${app.email}`, catNames && `Cats: ${catNames}`, notes, mapUrl && `Map: ${mapUrl}`, `${site.url}/admin/applications/${id}`]
      .filter(Boolean)
      .join("\n"),
  };
  const shared = { when: whenText, duration: `${minutes} minutes`, location: where, map_url: mapUrl, notes, cat_names: catNames };
  const mapButton = mapUrl ? button(mapUrl, "Open in Maps") : "";
  const inbox = await rescueInbox();

  let emailNote = "";
  if (on(fd, "send_email")) {
    const res = await sendTemplate({
      template: "meetInvite",
      to: { email: app.email, name: app.name },
      replyTo: inbox ? { email: inbox } : undefined,
      params: {
        ...shared,
        first_name: app.name.split(" ")[0],
        who,
        google_calendar_url: googleCalendarUrl(invite),
        outlook_calendar_url: outlookCalendarUrl(invite),
        apple_calendar_url: inviteIcsUrl(meeting.id),
      },
      fallback: {
        subject: `Your meet & greet${catNames ? ` with ${catNames}` : ""}: ${whenText}`,
        html: emailLayout(
          `<p>Hi ${escapeHtml(app.name.split(" ")[0])},</p>
<p>We'd love for you to meet ${escapeHtml(who)}! Here are the details:</p>
<p><strong>${escapeHtml(whenText)}</strong> (${minutes} minutes)<br>${escapeHtml(where)}</p>
${mapButton && `<p>${mapButton}</p>`}
${notes ? textToHtml(notes) : ""}
<p>${button(googleCalendarUrl(invite), "Add to Google Calendar")}${button(outlookCalendarUrl(invite), "Add to Outlook")}${button(inviteIcsUrl(meeting.id), "Add to Apple Calendar")}</p>
<p>If the time doesn't work, just reply to this email.</p>
<p>${escapeHtml(site.name)}</p>`,
        ),
      },
      attachments: ics(invite),
    });
    emailNote = res.ok ? " Invite emailed." : res.skipped ? " (Invite not emailed: email isn't set up yet.)" : " The invite email failed to send.";
  }

  if (inbox) {
    await sendTemplate({
      template: "meetBooked",
      to: { email: inbox },
      replyTo: { email: app.email, name: app.name },
      params: {
        ...shared,
        applicant_name: app.name,
        applicant_email: app.email,
        applicant_phone: app.phone,
        application_url: `${site.url}/admin/applications/${id}`,
        google_calendar_url: googleCalendarUrl(booked),
        outlook_calendar_url: outlookCalendarUrl(booked),
        apple_calendar_url: `${site.url}/admin/meetings/${meeting.id}/ics`,
      },
      fallback: {
        subject: `Meet & greet booked: ${app.name}, ${whenText}`,
        html: emailLayout(
          `<p>Meet & greet with <strong>${escapeHtml(app.name)}</strong>${catNames ? ` for ${escapeHtml(catNames)}` : ""}.</p>
<p><strong>${escapeHtml(whenText)}</strong> (${minutes} minutes)<br>${escapeHtml(where)}</p>
${mapButton && `<p>${mapButton}</p>`}
<p>${escapeHtml(app.phone)}<br>${escapeHtml(app.email)}</p>
${notes ? textToHtml(notes) : ""}
<p>${button(googleCalendarUrl(booked), "Add to Google Calendar")}${button(outlookCalendarUrl(booked), "Add to Outlook")}${button(`${site.url}/admin/meetings/${meeting.id}/ics`, "Add to Apple Calendar")}</p>
<p>${button(`${site.url}/admin/applications/${id}`, "Open the application")}</p>`,
        ),
      },
      attachments: ics(booked),
    });
  }

  refresh(id);
  revalidatePath("/admin/meetings");
  return { ok: true, message: `Meet & greet scheduled.${emailNote}` };
}

export async function setMeetingStatus(fd: FormData) {
  await assertStaff();
  const status = text(fd, "status");
  if (!["scheduled", "completed", "cancelled"].includes(status)) return;
  await run("update meetings set status = ? where id = ?", status, text(fd, "id"));
  refresh(text(fd, "application_id") || undefined);
  revalidatePath("/admin/meetings");
}
