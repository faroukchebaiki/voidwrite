import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth-helpers";
import { postNoteSchema } from "@/lib/validation";
import { db } from "@/db";
import { postNotes, posts, notifications } from "@/db/schema";
import { users } from "@/db/auth-schema";

export async function GET(_req: Request, context: any) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);

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
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const { id: idParam } = (context?.params || {}) as { id: string };
  const id = Number(idParam);

  const body = await req.json();
  const parsed = postNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return new NextResponse("Not found", { status: 404 });

  const noteText = parsed.data.note.trim();
  if (!noteText) {
    return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });
  }

  const adminId = (admin as any).id as string;
  const adminName = (admin as any).name || (admin as any).email || "Admin";

  const [created] = await db
    .insert(postNotes)
    .values({
      postId: id,
      authorId: adminId,
      note: noteText,
    })
    .returning();

  if (post.authorId && post.authorId !== adminId) {
    await db.insert(notifications).values({
      userId: post.authorId,
      type: "note" as any,
      payload: { postId: id, title: post.title, noteId: created.id, note: noteText } as any,
    });
  }

  const createdAt = created.createdAt instanceof Date ? created.createdAt.toISOString() : (created.createdAt as any);

  return NextResponse.json(
    {
      id: created.id,
      note: created.note,
      createdAt,
      authorId: created.authorId,
      authorName: adminName,
    },
    { status: 201 }
  );
}
