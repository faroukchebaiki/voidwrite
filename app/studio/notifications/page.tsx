import { auth } from "@/auth-app";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function NotificationsPage() {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return null;
  const list = await db.select().from(notifications).where(eq(notifications.userId, uid)).orderBy(desc(notifications.createdAt));
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="rounded border divide-y">
        {list.map((n:any)=> (
          <div key={n.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <div className="font-medium capitalize">{n.type}</div>
              <div className="text-muted-foreground">{n.payload?.title ? `Post: ${n.payload.title}` : ''}</div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {list.length === 0 && <div className="p-3 text-sm text-muted-foreground">No notifications.</div>}
      </div>
    </main>
  );
}
