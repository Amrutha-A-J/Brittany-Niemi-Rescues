"use server";

import { parseApplication, looksLikeSpam } from "./application-validate";
import { applicationTypeLabel } from "./forms";
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

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const type = formData.get("type") === "foster" ? "foster" : ("adopt" as ApplicationType);

  if (looksLikeSpam(formData)) return { ok: true }; // pretend success so bots don't retry

  if (!isSupabaseConfigured) {
    return { error: "Applications aren't switched on yet. Please message us on Instagram in the meantime." };
  }

  const { contact, answers, catSlug, fieldErrors } = parseApplication(type, formData);

  const supabase = createPublicClient();
  let cat: { id: string; name: string } | null = null;
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
