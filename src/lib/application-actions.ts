"use server";

import { parseApplication, looksLikeSpam } from "./application-validate";
import { applicationTypeLabel } from "./forms";
import { namesList } from "./cats";
import { button, emailLayout, escapeHtml, rescueInbox, sendTemplate } from "./email";
import { site } from "./site";
import { all, batch, insertSql, newId } from "./db";
import type { ApplicationType } from "./types";

export type ApplyState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const type = formData.get("type") === "foster" ? "foster" : ("adopt" as ApplicationType);

  if (looksLikeSpam(formData)) return { ok: true }; // pretend success so bots don't retry

  const { contact, answers, catSlugs, fieldErrors } = parseApplication(type, formData);

  if (Object.keys(fieldErrors).length) {
    return { error: "Please check the highlighted fields.", fieldErrors };
  }

  const found = catSlugs.length
    ? await all<{ id: string; name: string; slug: string }>(
        `select id, name, slug from cats where slug in (${catSlugs.map(() => "?").join(", ")})`,
        ...catSlugs,
      )
    : [];
  const cats = catSlugs.flatMap((slug) => found.filter((c) => c.slug === slug));

  const id = newId();
  try {
    await batch([
      insertSql("applications", {
        id,
        type,
        cat_id: cats[0]?.id ?? null,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        city: contact.city,
        answers: JSON.stringify(answers),
      }),
      ...cats.map((c, position) => insertSql("application_cats", { application_id: id, cat_id: c.id, position })),
    ]);
  } catch (error) {
    console.error("[application insert failed]", error);
    return { error: "Something went wrong sending your application. Please try again." };
  }

  const catNames = namesList(cats.map((c) => c.name));
  const about =
    type === "adopt"
      ? catNames
        ? `for ${catNames}`
        : "(no specific cat)"
      : catNames
        ? `to foster ${catNames}`
        : "to foster (open to any cat)";
  const firstName = contact.name.split(" ")[0];
  const typeLabel = applicationTypeLabel[type].toLowerCase();
  const reviewUrl = `${site.url}/admin/applications/${id}`;
  const inbox = await rescueInbox();

  await Promise.all([
    inbox &&
      sendTemplate({
        template: "newApplication",
        to: { email: inbox },
        replyTo: { email: contact.email, name: contact.name },
        params: {
          type: typeLabel,
          cat_names: catNames,
          applicant_name: contact.name,
          applicant_email: contact.email,
          applicant_phone: contact.phone,
          applicant_city: contact.city,
          review_url: reviewUrl,
        },
        fallback: {
          subject: `New ${typeLabel} application ${about} from ${contact.name}`,
          html: emailLayout(
            `<p>You have a new ${typeLabel} application ${escapeHtml(about)}.</p>
<p><strong>${escapeHtml(contact.name)}</strong><br>${escapeHtml(contact.email)}<br>${escapeHtml(contact.phone)}<br>${escapeHtml(contact.city)}</p>
<p>${button(reviewUrl, "Review it")}</p>`,
          ),
        },
      }),
    sendTemplate({
      template: "applicationReceived",
      to: { email: contact.email, name: contact.name },
      replyTo: inbox ? { email: inbox } : undefined,
      params: { first_name: firstName, type: typeLabel, cat_names: catNames },
      fallback: {
        subject: type === "adopt" ? `We got your application${catNames ? ` for ${catNames}` : ""}!` : "Thanks for offering to foster!",
        html: emailLayout(
          `<p>Hi ${escapeHtml(firstName)},</p>
<p>Thank you for your ${type === "adopt" ? `application${catNames ? ` to adopt <strong>${escapeHtml(catNames)}</strong>` : ""}` : "foster application"}. We read every one personally and will be in touch within a few days.</p>
<p>In the meantime, you can follow our cats on Instagram at <a href="https://www.instagram.com/${site.instagram}/">@${site.instagram}</a>.</p>
<p>With purrs,<br>${escapeHtml(site.name)}</p>`,
        ),
      },
    }),
  ]);

  return { ok: true };
}
