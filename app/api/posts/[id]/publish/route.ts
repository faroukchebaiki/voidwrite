import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, notifications, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(_req: Request, context: any) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (admin as any).id as string;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return new NextResponse("Not found", { status: 404 });
  const [updated] = await db
    .update(posts)
    .set({
      status: 'published' as any,
      approvedBy: uid,
      approvedAt: new Date(),
      publishedAt: p.publishedAt || new Date(),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  // Fetch approver name for notification payload
  const [profile] = await db
    .select({ firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(eq(profiles.userId, uid));
  const [userRow] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, uid));

  const fallbackName = (userRow?.name || userRow?.email || '').trim();
  const [fallbackFirst, ...fallbackRest] = fallbackName ? fallbackName.split(/\s+/) : [];
  const approverFirstName = profile?.firstName || fallbackFirst || null;
  const approverLastName = profile?.lastName || (fallbackRest.length ? fallbackRest.join(' ') : null);
  const approverName = [approverFirstName, approverLastName].filter(Boolean).join(' ') || fallbackName || 'Admin';

  // Notify author if exists
  if (p.authorId) {
    await db.insert(notifications).values({
      userId: p.authorId,
      type: 'approval' as any,
      payload: {
        postId: id,
        title: p.title,
        actorId: uid,
        actorName: approverName,
        actorFirstName: approverFirstName,
        actorLastName: approverLastName,
      } as any,
    });
  }

  return NextResponse.json(updated);
}
