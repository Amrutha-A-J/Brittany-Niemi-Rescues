"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { googleCalendarUrl, icsFile, parseLocalDateTime, formatDateTime } from "@/lib/calendar";
import { button, emailLayout, escapeHtml, rescueInbox, sendEmail, textToHtml } from "@/lib/email";
import { first, insertSql, newId, nested, nowIso, run, toApplication } from "@/lib/db";
import { site } from "@/lib/site";
import type { FormState } from "./auth-actions";
import { ensureFosterFromApplication } from "./fosters-db";
import { assertStaff } from "./session";

const on = (fd: FormData, name: string) => fd.get(name) === "on";
const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();

async function loadApplication(id: string) {
  await assertStaff();
  const row = await first(
    `select a.id, a.type, a.status, a.name, a.email, a.phone, a.city, a.answers, a.cat_id,
       json(case when c.id is null then null else json_object('id', c.id, 'name', c.name, 'slug', c.slug, 'status', c.status) end) as cat
     from applications a left join cats c on c.id = a.cat_id where a.id = ?`,
    id,
  );
  if (!row) throw new Error("Application not found");
  const cat = nested<{ id: string; name: string; slug: string; status: string }>(row.cat);
  return { app: toApplication(row), cat };
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
  const { app, cat } = await loadApplication(id);
  await run("update applications set status = 'approved', decided_at = ? where id = ?", nowIso(), id);

  if (cat && on(fd, "mark_pending") && cat.status === "available") {
    await run("update cats set status = 'pending' where id = ?", cat.id);
    revalidatePath("/");
    revalidatePath("/adopt");
    revalidatePath(`/cats/${cat.slug}`);
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
    const res = await sendEmail({
      to: { email: app.email, name: app.name },
      replyTo: rescueInbox() ? { email: rescueInbox() } : undefined,
      subject: app.type === "adopt" ? `Good news about ${cat ? cat.name : "your application"}!` : "Welcome to the foster team!",
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
    const res = await sendEmail({
      to: { email: app.email, name: app.name },
      replyTo: rescueInbox() ? { email: rescueInbox() } : undefined,
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
  const notes = text(fd, "notes");

  const { app, cat } = await loadApplication(id);
  const meeting = { id: newId() };
  await run(
    ...insertSql("meetings", { id: meeting.id, application_id: id, starts_at: start.toISOString(), duration_minutes: minutes, location, notes }),
  );
  if (app.status === "new") {
    await run("update applications set status = 'meet_scheduled' where id = ?", id);
  }

  const who = cat ? cat.name : app.type === "foster" ? "our foster team" : "our cats";
  const event = {
    uid: meeting.id,
    title: `Meet & greet with ${who} (${site.name})`,
    start,
    minutes,
    location,
    description: `Meet & greet with ${app.name}${cat ? ` for ${cat.name}` : ""}.${notes ? `\n\n${notes}` : ""}`,
  };
  const ics = Buffer.from(icsFile(event)).toString("base64");

  let emailNote = "";
  if (on(fd, "send_email")) {
    const res = await sendEmail({
      to: { email: app.email, name: app.name },
      replyTo: rescueInbox() ? { email: rescueInbox() } : undefined,
      subject: `Your meet & greet${cat ? ` with ${cat.name}` : ""}: ${formatDateTime(start.toISOString())}`,
      html: emailLayout(
        `<p>Hi ${escapeHtml(app.name.split(" ")[0])},</p>
<p>We'd love for you to meet ${escapeHtml(who)}! Here are the details:</p>
<p><strong>${escapeHtml(formatDateTime(start.toISOString()))}</strong> (${minutes} minutes)<br>${escapeHtml(location || "Location to be confirmed")}</p>
${notes ? textToHtml(notes) : ""}
<p>${button(googleCalendarUrl(event), "Add to Google Calendar")}</p>
<p style="font-size:13px;color:#666">Using Apple Calendar or Outlook? Open the attached <em>meet-and-greet.ics</em> file.</p>
<p>If the time doesn't work, just reply to this email.</p>
<p>${escapeHtml(site.name)}</p>`,
      ),
      attachments: [{ name: "meet-and-greet.ics", content: ics }],
    });
    emailNote = res.ok ? " Invite emailed." : res.skipped ? " (Invite not emailed: email isn't set up yet.)" : " The invite email failed to send.";
  }

  if (rescueInbox()) {
    await sendEmail({
      to: { email: rescueInbox() },
      subject: `Meet & greet booked: ${app.name}, ${formatDateTime(start.toISOString())}`,
      html: emailLayout(
        `<p>Meet & greet with <strong>${escapeHtml(app.name)}</strong>${cat ? ` for ${escapeHtml(cat.name)}` : ""}.</p>
<p>${escapeHtml(formatDateTime(start.toISOString()))} · ${escapeHtml(location)}</p>
<p>${button(googleCalendarUrl(event), "Add to Google Calendar")}</p>`,
      ),
      attachments: [{ name: "meet-and-greet.ics", content: ics }],
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
