import { NextResponse } from "next/server";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { passkeyLabels } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function ensureTable() {
  await db.execute(sql`
    create table if not exists passkey_labels (
      credential_id text primary key,
      user_id text not null,
      label text not null,
      updated_at timestamp not null default now()
    );
  `);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null) as { credentialId?: string; label?: string | null } | null;
  const credentialId = body?.credentialId?.trim();
  const label = body?.label?.trim();
  if (!credentialId || !label) {
    return NextResponse.json({ error: "credentialId and label are required" }, { status: 400 });
  }
  await ensureTable();
  const uid = (session.user as any).id as string;
  await db
    .insert(passkeyLabels)
    .values({ credentialId, userId: uid, label })
    .onConflictDoUpdate({
      target: passkeyLabels.credentialId,
      set: { userId: uid, label, updatedAt: new Date() },
    });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null) as { credentialId?: string } | null;
  const credentialId = body?.credentialId?.trim();
  if (!credentialId) {
    return NextResponse.json({ error: "credentialId is required" }, { status: 400 });
  }
  await ensureTable();
  const uid = (session.user as any).id as string;
  await db
    .delete(passkeyLabels)
    .where(and(eq(passkeyLabels.credentialId, credentialId), eq(passkeyLabels.userId, uid)));
  return NextResponse.json({ success: true });
}
