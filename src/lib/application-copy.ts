import "server-only";
import { applicationFields, applicationTypeLabel } from "./forms";
import { formatDate } from "./calendar";
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
