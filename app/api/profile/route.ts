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

  try {
    const action = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(profiles)
        .set(payload)
        .where(eq(profiles.userId, uid))
        .returning();

      let profileRow = updated;

      if (!updated) {
        const [created] = await tx
          .insert(profiles)
          .values({
            userId: uid,
            role: 'editor' as any,
            ...payload,
          })
          .returning();
        profileRow = created;
      }

      if (avatarProvided) {
        await tx
          .update(users)
          .set({ image: normalizedAvatar ?? null })
          .where(eq(users.id, uid));
      }

      return profileRow;
    });

    return NextResponse.json({ success: true, profile: action, message: 'Profile saved' });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
    console.error('Failed to save profile', error);
    return NextResponse.json({ error: 'Failed to save profile.' }, { status: 500 });
  }
}
