import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { passwordResetRequests } from "@/db/schema";
import { passwordResetStartSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import crypto from "node:crypto";
import { renderBrandedEmail, renderPlainTextEmail, renderCodeCallout } from "@/lib/emails";
import { siteConfig } from "@/site";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.CONTACT_FROM_ADDRESS || siteConfig.contact.fromEmail;
const EXPIRATION_MINUTES = 15;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  if (!resend) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  const body = await req.json();
  const parsed = passwordResetStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  const email = parsed.data.email.toLowerCase();

  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  if (!user) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);

  await db
    .insert(passwordResetRequests)
    .values({ email, codeHash, expiresAt, attempts: 0 })
    .onConflictDoUpdate({
      target: passwordResetRequests.email,
      set: {
        codeHash,
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
    });

  const html = renderBrandedEmail({
    heading: `Reset your ${siteConfig.title} password`,
    intro: `Enter the verification code below to set a new password for your ${siteConfig.title} account.`,
    content: `${renderCodeCallout(code, 'Password reset code')}<p style=\"margin:18px 0 0;\">This code expires in ${EXPIRATION_MINUTES} minutes. If you didn’t request a reset, you can ignore this email.</p>`,
  });
  const text = renderPlainTextEmail({
    heading: 'Reset your password',
    bodyLines: [
      `Code: ${code}`,
      `This code expires in ${EXPIRATION_MINUTES} minutes.`,
      `If you didn’t request a reset, you can ignore this email.`,
    ],
  });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: `Reset your ${siteConfig.title} password`,
    html,
    text,
  });
  if (error) {
    console.error('Failed to send password reset email', error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
