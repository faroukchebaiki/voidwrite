import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, profiles, notifications } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth-helpers";

export async function POST(_req: Request, context: any) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return new NextResponse("Not found", { status: 404 });
  if (!(p.authorId === uid || p.assignedTo === uid)) return new NextResponse('Forbidden', { status: 403 });
  const [updated] = await db.update(posts).set({ status: 'submitted' as any, submittedAt: new Date(), updatedAt: new Date() }).where(eq(posts.id, id)).returning();
  const [profile] = await db
    .select({ firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(eq(profiles.userId, uid));
  const [actorUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, uid));
  const fallbackName = (actorUser?.name || actorUser?.email || '').trim();
  const [fallbackFirst, ...fallbackRest] = fallbackName ? fallbackName.split(/\s+/) : [];
  const actorFirstName = profile?.firstName || fallbackFirst || null;
  const actorLastName = profile?.lastName || (fallbackRest.length ? fallbackRest.join(' ') : null);
  const actorName = [actorFirstName, actorLastName].filter(Boolean).join(' ') || fallbackName || 'Contributor';
  // Notify all admins
  const admins = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.role, 'admin' as any));
  const adminTargets = admins
    .map((a: any) => a.userId as string)
    .filter((userId): userId is string => Boolean(userId) && userId !== uid);
  if (adminTargets.length) {
    const payload = {
      postId: id,
      title: p.title,
      actorId: uid,
      actorName,
      actorFirstName,
      actorLastName,
    } as any;
    await db.insert(notifications).values(
      adminTargets.map((userId) => ({ userId, type: 'submission' as any, payload }))
    );
  }
  return NextResponse.json(updated);
}
