import { Resend } from "resend";
import { env } from "@/lib/env";

const PINK = "#D2447A";
const INK = "#3B1F2B";
const BLUSH = "#FFF3F7";

function shell(title: string, body: string, action?: { href: string; label: string }): string {
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:${BLUSH};font-family:Georgia,'Times New Roman',serif;color:${INK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border:1px solid #F5D9E4;border-radius:2px 18px 2px 18px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:32px 32px 8px">
        <p style="margin:0 0 20px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9B7185">Sekos</p>
        <h1 style="margin:0 0 12px;font-size:26px;font-weight:normal;line-height:1.25">${title}</h1>
        <div style="font-size:16px;line-height:1.6;color:#6B4757">${body}</div>
      </td></tr>
      ${
        action
          ? `<tr><td style="padding:8px 32px 32px">
        <a href="${action.href}" style="display:inline-block;background:${PINK};color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:999px;font-family:Helvetica,Arial,sans-serif;font-size:14px">${action.label}</a>
      </td></tr>`
          : ""
      }
    </table>
    <p style="max-width:480px;margin:18px auto 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#A98B98;text-align:left">You are getting this because someone you know set up a shared itinerary.</p>
  </td></tr></table>
</body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!env.resendKey) {
    console.warn(`[email] RESEND_API_KEY not set. Would have sent "${subject}" to ${to}`);
    return;
  }
  const resend = new Resend(env.resendKey);
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend refused the message: ${error.message}`);
}

export async function sendLoginLink(to: string, url: string): Promise<void> {
  await send(
    to,
    "Your link to sign in",
    shell(
      "Come on in",
      "<p style='margin:0'>This link signs you in and then expires. It works once, and only for twenty minutes.</p>",
      { href: url, label: "Open our itinerary" },
    ),
  );
}

export async function sendReminder(options: {
  to: string;
  title: string;
  when: string;
  place: string | null;
  pending: string[];
  url: string;
  leadLabel: string;
}): Promise<void> {
  const pending = options.pending.length
    ? `<p style="margin:18px 0 6px;font-size:14px;color:#9B7185">Still to sort</p><ul style="margin:0;padding-left:20px">${options.pending
        .map((item) => `<li style="margin-bottom:4px">${item}</li>`)
        .join("")}</ul>`
    : "";

  await send(
    options.to,
    `${options.leadLabel}: ${options.title}`,
    shell(
      options.title,
      `<p style="margin:0"><strong style="color:${INK}">${options.when}</strong>${
        options.place ? ` at ${options.place}` : ""
      }</p>${pending}`,
      { href: options.url, label: "See the plan" },
    ),
  );
}

export async function sendInvite(options: {
  to: string;
  fromName: string;
  url: string;
}): Promise<void> {
  await send(
    options.to,
    `${options.fromName} started something with you`,
    shell(
      "Somewhere with you",
      `<p style="margin:0">${options.fromName} made a place to keep the things you two keep saying you should do. Plans, the little lists that go with them, and afterwards, what it was actually like.</p>`,
      { href: options.url, label: "Join them" },
    ),
  );
}
