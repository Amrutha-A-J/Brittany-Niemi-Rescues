"use server";

import { applicationFields, applicationTypeLabel, contactFields } from "./forms";
import { button, emailLayout, escapeHtml, rescueInbox, sendEmail } from "./email";
import { site } from "./site";
import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured } from "./supabase/config";
import type { ApplicationType } from "./types";

export type ApplyState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const MAX = 4000;

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const type = formData.get("type") === "foster" ? "foster" : ("adopt" as ApplicationType);

  // Spam checks: a hidden field bots fill in, and a minimum time on the page.
  const started = Number(formData.get("started") || 0);
  if (formData.get("website") || !started || Date.now() - started < 3000) {
    return { ok: true }; // pretend success so bots don't retry
  }

  if (!isSupabaseConfigured) {
    return { error: "Applications aren't switched on yet. Please message us on Instagram in the meantime." };
  }

  const fieldErrors: Record<string, string> = {};
  const str = (name: string) => String(formData.get(name) ?? "").trim().slice(0, MAX);

  const contact = Object.fromEntries(contactFields.map((f) => [f.name, str(f.name)]));
  for (const f of contactFields) {
    if (f.required && !contact[f.name]) fieldErrors[f.name] = "Required";
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

  const supabase = createPublicClient();
  let cat: { id: string; name: string } | null = null;
  const catSlug = str("cat");
  if (type === "adopt" && catSlug) {
    const { data } = await supabase.from("cats").select("id, name").eq("slug", catSlug).maybeSingle();
    cat = data;
  }

  if (Object.keys(fieldErrors).length) {
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const { error } = await supabase.from("applications").insert({
    type,
    cat_id: cat?.id ?? null,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    city: contact.city,
    answers,
  });
  if (error) {
    console.error("[application insert failed]", error);
    return { error: "Something went wrong sending your application. Please try again." };
  }

  const about = type === "adopt" ? (cat ? `for ${cat.name}` : "(no specific cat)") : "to foster";
  const firstName = contact.name.split(" ")[0];

  await Promise.all([
    rescueInbox() &&
      sendEmail({
        to: { email: rescueInbox() },
        replyTo: { email: contact.email, name: contact.name },
        subject: `New ${applicationTypeLabel[type].toLowerCase()} application ${about} from ${contact.name}`,
        html: emailLayout(
          `<p>You have a new ${applicationTypeLabel[type].toLowerCase()} application ${escapeHtml(about)}.</p>
<p><strong>${escapeHtml(contact.name)}</strong><br>${escapeHtml(contact.email)}<br>${escapeHtml(contact.phone)}<br>${escapeHtml(contact.city)}</p>
<p>${button(`${site.url}/admin/applications`, "Review it")}</p>`,
        ),
      }),
    sendEmail({
      to: { email: contact.email, name: contact.name },
      subject: type === "adopt" ? `We got your application${cat ? ` for ${cat.name}` : ""}!` : "Thanks for offering to foster!",
      html: emailLayout(
        `<p>Hi ${escapeHtml(firstName)},</p>
<p>Thank you for your ${type === "adopt" ? `application${cat ? ` to adopt <strong>${escapeHtml(cat.name)}</strong>` : ""}` : "foster application"}. We read every one personally and will be in touch within a few days.</p>
<p>In the meantime, you can follow our cats on Instagram at <a href="https://www.instagram.com/${site.instagram}/">@${site.instagram}</a>.</p>
<p>With purrs,<br>${escapeHtml(site.name)}</p>`,
      ),
    }),
  ]);

  return { ok: true };
}
