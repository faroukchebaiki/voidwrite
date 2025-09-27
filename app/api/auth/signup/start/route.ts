import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { invites, profiles, signupRequests } from "@/db/schema";
import { signupSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { Resend } from "resend";
import crypto from "node:crypto";
import { renderBrandedEmail, renderPlainTextEmail, renderCodeCallout } from "@/lib/emails";
import { siteConfig } from "@/site";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const VERIFY_FROM = process.env.CONTACT_FROM_ADDRESS || "Voidwrite <hello@voidwrite.local>";

function generateCode() {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  if (!resend) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, name, inviteCode } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const existingUser = await db.select().from(users).where(eq(users.email, lowerEmail)).limit(1);
  if (existingUser.length > 0) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const existingProfiles = await db.select({ id: profiles.userId }).from(profiles).limit(1);
  const isFirstUser = existingProfiles.length === 0;

  if (!isFirstUser) {
    if (!inviteCode) {
      return NextResponse.json({ error: "Invitation code required" }, { status: 400 });
    }
    const inviteRows = await db.select().from(invites).where(eq(invites.code, inviteCode.trim()));
    const invite = inviteRows[0];
    if (!invite) {
      return NextResponse.json({ error: "Invalid invitation code" }, { status: 400 });
    }
    if (invite.usedBy) {
      return NextResponse.json({ error: "Invitation code already used" }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(password);
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .insert(signupRequests)
    .values({
      email: lowerEmail,
      name: name?.trim() || null,
      passwordHash,
      inviteCode: inviteCode?.trim() || null,
      codeHash,
      expiresAt,
      attempts: 0,
    })
    .onConflictDoUpdate({
      target: signupRequests.email,
      set: {
        name: name?.trim() || null,
        passwordHash,
        inviteCode: inviteCode?.trim() || null,
        codeHash,
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
    });

  const html = renderBrandedEmail({
    heading: `Confirm your ${siteConfig.title} account`,
    intro: `Thanks for joining ${siteConfig.title}! Enter the verification code below to finish creating your account.`,
    content: `${renderCodeCallout(code, 'Verification code')}<p style=\"margin:18px 0 0;\">This code expires in <strong>15 minutes</strong>. If you didn’t try to sign up, you can ignore this email.</p>`,
    footerNote: 'Need help? Reply to this email and we\'ll take a look.',
  });
  const text = renderPlainTextEmail({
    heading: 'Verify your account',
    bodyLines: [
      `Your verification code is ${code}.`,
      'It will expire in 15 minutes.',
      `If you didn’t try to join ${siteConfig.title}, you can ignore this message.`,
    ],
  });

  const { data, error: sendError } = await resend.emails.send({
    from: VERIFY_FROM,
    to: [lowerEmail],
    subject: `Verify your ${siteConfig.title} account`,
    text,
    html,
  });
  if (sendError) {
    console.error('Failed to send signup verification email', sendError);
    return NextResponse.json({ error: sendError.message || 'Failed to send verification email' }, { status: 502 });
  }
  if (!data?.id) {
    return NextResponse.json({ error: 'Verification email response missing id.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
