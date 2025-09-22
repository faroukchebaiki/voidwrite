import { NextResponse } from "next/server";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const uid = (session.user as any).id as string;
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  if (!profile && !user) return NextResponse.json(null);
  return NextResponse.json({
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    bio: profile?.bio ?? null,
    link: profile?.link ?? null,
    username: profile?.username ?? null,
    avatarUrl: user?.image ?? null,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const uid = (session.user as any).id as string;
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data as any;
  const payload = {
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    bio: data.bio ?? null,
    link: data.link ?? null,
    username: data.username ?? null,
  };
  const avatarProvided = Object.prototype.hasOwnProperty.call(data, 'avatarUrl');
  const normalizedAvatar = avatarProvided
    ? (data.avatarUrl ? data.avatarUrl.trim() : null)
    : undefined;
  const [updated] = await db
    .update(profiles)
    .set(payload)
    .where(eq(profiles.userId, uid))
    .returning();
  if (avatarProvided) {
    await db
      .update(users)
      .set({ image: normalizedAvatar ?? null })
      .where(eq(users.id, uid));
  }
  if (updated) {
    return NextResponse.json({ success: true, profile: updated, message: 'Profile saved' });
  }

  const [created] = await db
    .insert(profiles)
    .values({
      userId: uid,
      role: 'editor',
      ...payload,
    })
    .returning();

  if (avatarProvided) {
    await db
      .update(users)
      .set({ image: normalizedAvatar ?? null })
      .where(eq(users.id, uid));
  }

  return NextResponse.json({ success: true, profile: created, message: 'Profile saved' });
}
