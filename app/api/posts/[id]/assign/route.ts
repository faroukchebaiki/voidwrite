import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { assignPostSchema } from "@/lib/validation";

export async function POST(req: Request, context: any) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
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
  };
  let trimmedNote: string | null = null;
  if (note !== undefined) {
    trimmedNote = typeof note === "string" ? note.trim() : null;
    update.adminNote = trimmedNote && trimmedNote.length ? trimmedNote : null;
  }
  const [updated] = await db.update(posts).set(update as any).where(eq(posts.id, id)).returning();
  // Notify assignee
  await db.insert(notifications).values({
    userId: assignedTo,
    type: 'assignment' as any,
    payload: {
      postId: id,
      title: p.title,
      note: trimmedNote,
    } as any,
  });
  return NextResponse.json(updated);
}
