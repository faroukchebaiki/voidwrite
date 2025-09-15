import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, profiles, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const uid = (user as any).id as string;
  const { id: idParam } = await params;
  const id = Number(idParam);
  const [p] = await db.select().from(posts).where(eq(posts.id, id));
  if (!p) return new NextResponse("Not found", { status: 404 });
  if (!(p.authorId === uid || p.assignedTo === uid)) return new NextResponse('Forbidden', { status: 403 });
  const [updated] = await db.update(posts).set({ status: 'submitted' as any, submittedAt: new Date(), updatedAt: new Date() }).where(eq(posts.id, id)).returning();
  // Notify all admins
  const admins = await db.select().from(profiles).where(eq(profiles.role, 'admin' as any));
  if (admins.length) {
    await db.insert(notifications).values(admins.map((a:any)=>({ userId: a.userId, type: 'submission' as any, payload: { postId: id, title: p.title } as any })));
  }
  return NextResponse.json(updated);
}

