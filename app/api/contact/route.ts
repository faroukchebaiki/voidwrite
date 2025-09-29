import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { siteConfig } from "@/site";
import { renderBrandedEmail, renderPlainTextEmail } from "@/lib/emails";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const TEAM_EMAIL = process.env.CONTACT_TO_ADDRESS || siteConfig.contact.email;
const FROM_EMAIL = process.env.CONTACT_FROM_ADDRESS || siteConfig.contact.fromEmail;

export async function POST(req: Request) {
  if (!resend) {
    return NextResponse.json({ error: "Contact form is not configured." }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form fields." }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  const html = renderBrandedEmail({
    heading: `New message for ${siteConfig.title}`,
    intro: `A reader just reached out via the ${siteConfig.title} contact form.`,
    content: `
      <table style="width:100%; border-collapse:collapse; margin:18px 0;">
        <tbody>
          <tr>
            <td style=\"padding:8px 12px; font-weight:600; color:#111827; width:120px;\">Name</td>
            <td style=\"padding:8px 12px; color:#374151;\">${escapeHtml(name)}</td>
          </tr>
          <tr style=\"background:#f9fafb;\">
            <td style=\"padding:8px 12px; font-weight:600; color:#111827;\">Email</td>
            <td style=\"padding:8px 12px; color:#374151;\">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style=\"padding:8px 12px; font-weight:600; color:#111827;\">Subject</td>
            <td style=\"padding:8px 12px; color:#374151;\">${escapeHtml(subject)}</td>
          </tr>
        </tbody>
      </table>
      <p style=\"margin:24px 0 8px; font-weight:600;\">Message</p>
      <div style=\"padding:16px 20px; border-radius:12px; background:#f3f4f6; color:#1f2937; line-height:1.7;\">${escapeHtml(message).replace(/\n/g, '<br />')}</div>
      <p style=\"margin-top:24px; font-size:13px; color:#6b7280;\">Reply directly to this email to respond.</p>
    `,
    footerNote: `Submitted from the ${siteConfig.title} contact page.`,
  });
  const text = renderPlainTextEmail({
    heading: "New contact form submission",
    bodyLines: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      message,
    ],
    footerNote: "Reply directly to this email to respond.",
  });

  try {
    const { data, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TEAM_EMAIL],
      subject: `[Contact] ${subject}`,
      replyTo: email || siteConfig.contact.replyTo,
      text,
      html,
    });
    if (sendError) {
      console.error("Failed to send contact email", sendError);
      return NextResponse.json({ error: sendError.message || "Failed to send email" }, { status: 502 });
    }
    if (!data?.id) {
      return NextResponse.json({ error: "Email delivery response missing id." }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to send contact email", error);
    return NextResponse.json({ error: "We couldn't send your message right now. Please try again later." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
