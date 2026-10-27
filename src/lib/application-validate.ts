import { applicationFields, contactFields } from "./forms";
import type { ApplicationType } from "./types";

const MAX = 4000;

/** Validates an application form submission. Shared by the real server action and demo mode. */
export function parseApplication(type: ApplicationType, formData: FormData) {
  const fieldErrors: Record<string, string> = {};
  const str = (name: string) => String(formData.get(name) ?? "").trim().slice(0, MAX);

  const contact = Object.fromEntries(contactFields.map((f) => [f.name, str(f.name)])) as Record<
    "name" | "email" | "phone" | "city",
    string
  >;
  for (const f of contactFields) {
    if (f.required && !contact[f.name as keyof typeof contact]) fieldErrors[f.name] = "Required";
  }
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) fieldErrors.email = "Enter a valid email";

  const answers: Record<string, string | string[]> = {};
  for (const f of applicationFields[type]) {
    const visible = !f.showIf || f.showIf.values.includes(str(f.showIf.field));
    if (!visible) continue;
    if (f.type === "checkboxes") {
      const values = formData
        .getAll(f.name)
        .map(String)
        .filter((v) => f.options?.includes(v));
      if (f.required && values.length === 0) fieldErrors[f.name] = "Choose at least one";
      answers[f.name] = values;
    } else {
      const v = str(f.name);
      if (f.required && !v) fieldErrors[f.name] = "Required";
      if (v && f.options && !f.options.includes(v)) fieldErrors[f.name] = "Choose an option";
      answers[f.name] = v;
    }
  }

  const catSlugs = [...new Set(formData.getAll("cat").map((v) => String(v).trim()).filter(Boolean))].slice(0, 10);

  return { contact, answers, catSlugs, fieldErrors };
}

/** True when the submission looks like a bot (hidden field filled, or sent too fast). */
export function looksLikeSpam(formData: FormData) {
  const started = Number(formData.get("started") || 0);
  return Boolean(formData.get("website")) || !started || Date.now() - started < 3000;
}
