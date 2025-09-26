import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

import { requireUser } from "@/lib/auth-helpers";
import { postNoteSchema } from "@/lib/validation";
import { db } from "@/db";
import { postNotes, posts, notifications, profiles } from "@/db/schema";
import { users } from "@/db/auth-schema";

export async function GET(_req: Request, context: any) {
  const sessionUser = await requireUser();
  if (!sessionUser) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (sessionUser as any).id as string;
  const role = (sessionUser as any).role as string | undefined;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);

  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return new NextResponse("Not found", { status: 404 });

  const isAdmin = role === 'admin';
  const isAuthor = post.authorId === uid;
  const isAssignee = post.assignedTo === uid;
  if (!isAdmin && !isAuthor && !isAssignee) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const notes = await db
    .select({
      id: postNotes.id,
      note: postNotes.note,
      createdAt: postNotes.createdAt,
      authorId: postNotes.authorId,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(postNotes)
    .leftJoin(users, eq(users.id, postNotes.authorId))
    .where(eq(postNotes.postId, id))
    .orderBy(desc(postNotes.createdAt));

  return NextResponse.json(
    notes.map((n) => ({
      id: n.id,
      note: n.note,
      createdAt: n.createdAt,
      authorId: n.authorId,
      authorName: n.authorName || n.authorEmail || "Unknown",
    }))
  );
}

export async function POST(req: Request, context: any) {
  const sessionUser = await requireUser();
  if (!sessionUser) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (sessionUser as any).id as string;
  const role = (sessionUser as any).role as string | undefined;
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);

  const body = await req.json();
  const parsed = postNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return new NextResponse("Not found", { status: 404 });

  const isAdmin = role === 'admin';
  const isAuthor = post.authorId === uid;
  const isAssignee = post.assignedTo === uid;
  if (!isAdmin && !isAuthor && !isAssignee) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const noteText = parsed.data.note.trim();
  if (!noteText) {
    return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
  }
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
  const actorName = [actorFirstName, actorLastName].filter(Boolean).join(' ') || fallbackName || (isAdmin ? 'Admin' : 'Member');

  const [created] = await db
    .insert(postNotes)
    .values({
      postId: id,
      authorId: uid,
      note: noteText,
    })
    .returning();

  const adminProfiles = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.role, 'admin' as any));
  const targetIds = new Set<string>();
  for (const record of adminProfiles) {
    const targetId = record.userId as string | null;
    if (targetId && targetId !== uid) targetIds.add(targetId);
  }
  if (post.authorId && post.authorId !== uid) {
    targetIds.add(post.authorId);
  }

  const notificationsPayload = {
    postId: id,
    title: post.title,
    noteId: created.id,
    note: noteText,
    actorId: uid,
    actorName,
    actorFirstName,
    actorLastName,
  } as any;

  if (targetIds.size) {
    await db.insert(notifications).values(
      Array.from(targetIds).map((userId) => ({ userId, type: 'comment' as any, payload: notificationsPayload }))
    );
  }

  const createdAt = created.createdAt instanceof Date ? created.createdAt.toISOString() : (created.createdAt as any);

  return NextResponse.json(
    {
      id: created.id,
      note: created.note,
      createdAt,
      authorId: created.authorId,
      authorName: actorName,
    },
    { status: 201 }
  );
}
