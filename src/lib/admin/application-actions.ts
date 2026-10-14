"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { googleCalendarUrl, icsFile, parseLocalDateTime, formatDateTime } from "@/lib/calendar";
import { button, emailLayout, escapeHtml, rescueInbox, sendEmail, textToHtml } from "@/lib/email";
import { site } from "@/lib/site";
import type { FormState } from "./auth-actions";
import { staffClient } from "./session";

const on = (fd: FormData, name: string) => fd.get(name) === "on";
const text = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();

async function loadApplication(id: string) {
  const supabase = await staffClient();
  const { data, error } = await supabase
    .from("applications")
    .select("id, type, status, name, email, cat_id, cats(id, name, slug, status)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  const cat = (Array.isArray(data.cats) ? data.cats[0] : data.cats) as
    | { id: string; name: string; slug: string; status: string }
    | null;
  return { supabase, app: data, cat };
}

function refresh(id?: string) {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/applications/${id}`);
}

export async function saveNotes(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await staffClient();
  const { error } = await supabase.from("applications").update({ admin_notes: text(fd, "notes") }).eq("id", text(fd, "id"));
  if (error) return { error: error.message };
  refresh(text(fd, "id"));
  return { message: "Notes saved." };
}

export async function approveApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const { supabase, app, cat } = await loadApplication(id);
  const { error } = await supabase
    .from("applications")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  if (cat && on(fd, "mark_pending") && cat.status === "available") {
    await supabase.from("cats").update({ status: "pending" }).eq("id", cat.id);
    revalidatePath("/");
    revalidatePath("/adopt");
    revalidatePath(`/cats/${cat.slug}`);
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
  return { message: `Approved.${emailNote}` };
}

export async function rejectApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id");
  const { supabase, app } = await loadApplication(id);
  const { error } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

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
  const supabase = await staffClient();
  const id = text(fd, "id");
  await supabase.from("applications").update({ status: "new", decided_at: null }).eq("id", id);
  refresh(id);
}

export async function deleteApplication(fd: FormData) {
  const supabase = await staffClient();
  const { data } = await supabase.from("applications").delete().eq("id", text(fd, "id")).select("type").single();
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

  const { supabase, app, cat } = await loadApplication(id);
  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({ application_id: id, starts_at: start.toISOString(), duration_minutes: minutes, location, notes })
    .select("id")
    .single();
  if (error) return { error: error.message };
  if (app.status === "new") {
    await supabase.from("applications").update({ status: "meet_scheduled" }).eq("id", id);
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
  const supabase = await staffClient();
  const status = text(fd, "status");
  if (!["scheduled", "completed", "cancelled"].includes(status)) return;
  await supabase.from("meetings").update({ status }).eq("id", text(fd, "id"));
  refresh(text(fd, "application_id") || undefined);
  revalidatePath("/admin/meetings");
}
