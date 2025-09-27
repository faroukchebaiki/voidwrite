import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const TEAM_EMAIL = process.env.CONTACT_TO_ADDRESS || "hello@voidwrite.local";
const FROM_EMAIL = process.env.CONTACT_FROM_ADDRESS || "Voidwrite <hello@voidwrite.local>";

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
  const plain = `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`;

  try {
    const { data, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TEAM_EMAIL],
      subject: `[Contact] ${subject}`,
      replyTo: email,
      text: plain,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`,
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
