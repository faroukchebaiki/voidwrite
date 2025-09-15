import { NextResponse } from "next/server";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const uid = (session.user as any).id as string;
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, uid));
  return NextResponse.json(p || null);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const uid = (session.user as any).id as string;
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data as any;
  const [updated] = await db
    .update(profiles)
    .set({
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      bio: data.bio ?? null,
      link: data.link ?? null,
      username: data.username ?? undefined,
    })
    .where(eq(profiles.userId, uid))
    .returning();
  return NextResponse.json(updated);
}

