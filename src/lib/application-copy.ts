import "server-only";
import { applicationFields, applicationTypeLabel } from "./forms";
import { formatDate } from "./calendar";
import { button, emailLayout, escapeHtml, sendEmail } from "./email";
import { site } from "./site";
import { buildPdf, type PdfBlock } from "./pdf";
import type { Application } from "./types";

const answer = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v) || "";

/** A printable PDF of an application, as a base64 email attachment. */
export function applicationPdf(app: Application, catNames: string) {
  const type = applicationTypeLabel[app.type];
  const blocks: PdfBlock[] = [
    { kind: "title", text: `${type} application: ${app.name}` },
    { kind: "subtitle", text: `${site.name}  ·  Received ${formatDate(app.created_at)}` },
    { kind: "heading", text: "Contact" },
    { kind: "field", label: "Name", value: app.name },
    { kind: "field", label: "Email", value: app.email },
    { kind: "field", label: "Phone", value: app.phone },
    { kind: "field", label: "Town or city", value: app.city },
    { kind: "heading", text: "Cat" },
    { kind: "field", label: app.type === "adopt" ? "Applying to adopt" : "Applying to foster", value: catNames || (app.type === "adopt" ? "No specific cat" : "Open to any cat") },
    { kind: "heading", text: "Answers" },
    ...applicationFields[app.type]
      .filter((f) => app.answers[f.name] !== undefined)
      .map((f): PdfBlock => ({ kind: "field", label: f.label, value: answer(app.answers[f.name]) })),
  ];
  const bytes = buildPdf(blocks, `${site.name}: ${type.toLowerCase()} application from ${app.name}`);
  const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "applicant";
  return { name: `${app.type}-application-${slug}.pdf`, content: Buffer.from(bytes).toString("base64") };
}

/** Also sent a copy of every application, besides the rescue's own inbox. */
export const COPY_ALSO_TO = ["pixelmoose.development@gmail.com"];

/** Emails the application with its PDF to each address; true if all were sent. */
export async function sendApplicationCopy(app: Application, catNames: string, to: string[]) {
  const typeLabel = applicationTypeLabel[app.type].toLowerCase();
  const subject = `Copy of ${typeLabel} application from ${app.name}`;
  const html = emailLayout(
    `<p>Here is a copy of the ${typeLabel} application from <strong>${escapeHtml(app.name)}</strong>${catNames ? ` (${escapeHtml(catNames)})` : ""}. A printable PDF is attached.</p>
<p>${escapeHtml(app.email)}<br>${escapeHtml(app.phone)}</p>
<p>${button(`${site.url}/admin/applications/${app.id}`, "Open the application")}</p>`,
  );
  const attachments = [applicationPdf(app, catNames)];
  const results = await Promise.all(
    to.map((email) => sendEmail({ to: { email }, replyTo: { email: app.email, name: app.name }, subject, html, attachments })),
  );
  return { ok: results.every((r) => r.ok), skipped: results.some((r) => r.skipped) };
}
