import { auth } from "@/auth-app";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function StudioHome() {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  const total = (await db.select().from(posts)).length;
  const mine = uid ? (await db.select().from(posts).where(eq(posts.authorId, uid))).length : 0;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Studio</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Total posts</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Your posts</div>
          <div className="text-2xl font-semibold">{mine}</div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

