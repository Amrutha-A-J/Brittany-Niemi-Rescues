import "server-only";
import { site } from "./site";

type Attachment = { name: string; content: string /* base64 */ };

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Plain text → safe HTML paragraphs. */
export function textToHtml(s: string) {
  return escapeHtml(s.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function emailLayout(bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f6;padding:24px 12px;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#111;font-size:15px;line-height:1.55">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px 28px">
<p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;margin:0 0 24px">${escapeHtml(site.name)}</p>
${bodyHtml}
</div>
<p style="text-align:center;color:#888;font-size:12px;margin:16px 0 0">${escapeHtml(site.name)} · ${escapeHtml(site.city)}, ${site.regionCode}</p>
</body></html>`;
}

export function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:10px 18px;font-size:14px;margin:4px 8px 4px 0">${escapeHtml(label)}</a>`;
}

// Read on each send: on Cloudflare, settings reach process.env per request, not at module load.
const isEmailConfigured = () => Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

/**
 * Sends an email through Brevo's transactional API.
 * Never throws: a failed email should not break the action that triggered it.
 */
export async function sendEmail(opts: {
  to: { email: string; name?: string };
  replyTo?: { email: string; name?: string };
  attachments?: Attachment[];
} & (
  | { subject: string; html: string }
  // A template saved in Brevo; its subject and design live there, and `params` fill its {{ params.x }} placeholders.
  | { templateId: number; params?: Record<string, string> }
)): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isEmailConfigured()) {
    const what = "templateId" in opts ? `template=${opts.templateId}` : `subject="${opts.subject}"`;
    console.info(`[email skipped: Brevo not configured] to=${opts.to.email} ${what}`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || site.name },
        to: [opts.to],
        ...("templateId" in opts
          ? { templateId: opts.templateId, params: opts.params }
          : { subject: opts.subject, htmlContent: opts.html }),
        replyTo: opts.replyTo,
        attachment: opts.attachments?.length ? opts.attachments : undefined,
      }),
    });
    if (!res.ok) {
      console.error("[email failed]", res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email failed]", err);
    return { ok: false };
  }
}

export const rescueInbox = () => process.env.RESCUE_NOTIFY_EMAIL || process.env.EMAIL_FROM || "";
