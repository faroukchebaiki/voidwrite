import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles, posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, isMaster } from "@/lib/auth-helpers";

// Delete a user after transferring posts to another userId
export async function DELETE(req: Request, context: any) {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = (context?.params || {}) as { id: string };
  if (await isMaster(id)) return new NextResponse('Cannot delete master admin', { status: 400 });
  const url = new URL(req.url);
  const transferTo = url.searchParams.get('transferTo');
  if (!transferTo) return new NextResponse('Missing transferTo', { status: 400 });
  // Reassign posts
  await db.update(posts).set({ authorId: transferTo, createdBy: transferTo }).where(eq(posts.authorId, id));
  await db.update(posts).set({ assignedTo: transferTo }).where(eq(posts.assignedTo, id));
  // Delete profile then user
  await db.delete(profiles).where(eq(profiles.userId, id));
  await db.delete(users).where(eq(users.id, id));
  return new NextResponse(null, { status: 204 });
}
