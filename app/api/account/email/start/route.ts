import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { emailChangeRequests, profiles } from "@/db/schema";
import { emailChangeStartSchema } from "@/lib/validation";
import { requireStaff } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import crypto from "node:crypto";
import { verifyPassword } from "@/lib/password";
import { renderBrandedEmail, renderPlainTextEmail, renderCodeCallout } from "@/lib/emails";
import { siteConfig } from "@/site";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const EMAIL_FROM = process.env.CONTACT_FROM_ADDRESS || siteConfig.contact.fromEmail;
const EXPIRATION_MINUTES = 15;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: Request) {
  if (!resend) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = emailChangeStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { newEmail, password } = parsed.data;
  const uid = (user as any)?.id as string | undefined;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRows = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  const currentUser = userRows[0];
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const currentEmail = (currentUser.email || "").toLowerCase();
  const targetEmail = newEmail.toLowerCase();
  if (currentEmail === targetEmail) {
    return NextResponse.json({ error: "New email matches current email." }, { status: 400 });
  }

  const profileRows = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
  const profile = profileRows[0];
  if (!profile?.passwordHash) {
    return NextResponse.json({ error: "Set a password before changing your email." }, { status: 400 });
  }
  const passwordOk = await verifyPassword(profile.passwordHash, password);
  if (!passwordOk) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
  }

  const existingTarget = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);
  if (existingTarget.length > 0) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const oldCode = generateCode();
  const newCode = generateCode();
  const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);

  await db
    .insert(emailChangeRequests)
    .values({
      userId: uid,
      newEmail: targetEmail,
      oldCodeHash: hashCode(oldCode),
      newCodeHash: hashCode(newCode),
      expiresAt,
      attempts: 0,
    })
    .onConflictDoUpdate({
      target: emailChangeRequests.userId,
      set: {
        newEmail: targetEmail,
        oldCodeHash: hashCode(oldCode),
        newCodeHash: hashCode(newCode),
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      },
    });

  const oldHtml = renderBrandedEmail({
    heading: `Confirm your ${siteConfig.title} email change`,
    intro: `We received a request to change the email address on your ${siteConfig.title} account.`,
    content: `${renderCodeCallout(oldCode, 'Code for current email')}<p style=\"margin:18px 0 0;\">If you didn’t initiate this change, please contact an administrator immediately.</p>`,
    footerNote: 'This code expires in 15 minutes.',
  });
  const oldText = renderPlainTextEmail({
    heading: 'Confirm your email change',
    bodyLines: [
      `Code: ${oldCode}`,
      'If you did not request this change, contact an administrator immediately.',
    ],
  });

  const newHtml = renderBrandedEmail({
    heading: `Verify your new ${siteConfig.title} email`,
    intro: `Enter the code below to confirm the new email address for your ${siteConfig.title} account.`,
    content: `${renderCodeCallout(newCode, 'Code for new email')}<p style=\"margin:18px 0 0;\">This code expires in ${EXPIRATION_MINUTES} minutes.</p>`,
  });
  const newText = renderPlainTextEmail({
    heading: 'Verify your new email',
    bodyLines: [
      `Code: ${newCode}`,
      `This code expires in ${EXPIRATION_MINUTES} minutes.`,
    ],
  });

  const oldResult = await resend.emails.send({
    from: EMAIL_FROM,
    to: [currentEmail],
    subject: `Confirm your ${siteConfig.title} email change`,
    text: oldText,
    html: oldHtml,
  });
  if (oldResult.error) {
    console.error('Failed to send email change code (old email)', oldResult.error);
    return NextResponse.json({ error: oldResult.error.message || 'Failed to send code to current email.' }, { status: 502 });
  }
  if (!oldResult.data?.id) {
    return NextResponse.json({ error: 'Email delivery response missing id (old email).' }, { status: 502 });
  }

  const newResult = await resend.emails.send({
    from: EMAIL_FROM,
    to: [targetEmail],
    subject: `Verify your new ${siteConfig.title} email`,
    text: newText,
    html: newHtml,
  });
  if (newResult.error) {
    console.error('Failed to send email change code (new email)', newResult.error);
    return NextResponse.json({ error: newResult.error.message || 'Failed to send code to new email.' }, { status: 502 });
  }
  if (!newResult.data?.id) {
    return NextResponse.json({ error: 'Email delivery response missing id (new email).' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, expiresAt }, { status: 200 });
}
