import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, notifications, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { assignPostSchema } from "@/lib/validation";

export async function POST(req: Request, context: any) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const assignerId = (admin as any).id as string;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);
  const body = await req.json();
  const parsed = assignPostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { assignedTo, note } = parsed.data;
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return new NextResponse("Not found", { status: 404 });
  if (!p.title?.trim()) {
    return new NextResponse("Post requires a title before assignment", { status: 400 });
  }
  const update: Record<string, any> = {
    assignedTo,
    updatedAt: new Date(),
    trashed: false,
    trashedAt: null,
  };
  let trimmedNote: string | null = null;
  if (note !== undefined) {
    trimmedNote = typeof note === "string" ? note.trim() : null;
    update.adminNote = trimmedNote && trimmedNote.length ? trimmedNote : null;
  }
  const [updated] = await db.update(posts).set(update as any).where(eq(posts.id, id)).returning();

  const [assignerProfile] = await db
    .select({ firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(eq(profiles.userId, assignerId));
  const [assignerUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, assignerId));
  const assignerFallback = (assignerUser?.name || assignerUser?.email || '').trim();
  const [assignerFallbackFirst, ...assignerFallbackRest] = assignerFallback ? assignerFallback.split(/\s+/) : [];
  const actorFirstName = assignerProfile?.firstName || assignerFallbackFirst || null;
  const actorLastName = assignerProfile?.lastName || (assignerFallbackRest.length ? assignerFallbackRest.join(' ') : null);
  const actorName = [actorFirstName, actorLastName].filter(Boolean).join(' ') || assignerFallback || 'Admin';

  const [assigneeProfile] = await db
    .select({ firstName: profiles.firstName, lastName: profiles.lastName })
    .from(profiles)
    .where(eq(profiles.userId, assignedTo));
  const [assigneeUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, assignedTo));
  const assigneeFallback = (assigneeUser?.name || assigneeUser?.email || '').trim();
  const assigneeName = [assigneeProfile?.firstName, assigneeProfile?.lastName]
    .filter(Boolean)
    .join(' ') || assigneeFallback || assignedTo;

  // Notify assignee
  await db.insert(notifications).values({
    userId: assignedTo,
    type: 'assignment' as any,
    payload: {
      postId: id,
      title: p.title,
      note: trimmedNote,
      actorId: assignerId,
      actorName,
      actorFirstName,
      actorLastName,
      assignedToName: assigneeName,
    } as any,
  });
  return NextResponse.json(updated);
}
