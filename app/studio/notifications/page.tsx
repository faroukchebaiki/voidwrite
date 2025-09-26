import { auth } from "@/auth-app";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import NotificationsClient, { type NotificationRow } from "@/components/NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return null;
  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, uid))
    .orderBy(desc(notifications.createdAt));

  const initial: NotificationRow[] = list.map((item: any) => ({
    id: item.id,
    userId: item.userId,
    type: String(item.type),
    payload: item.payload as Record<string, any> | null,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    readAt: item.readAt ? (item.readAt instanceof Date ? item.readAt.toISOString() : String(item.readAt)) : null,
  }));

  return (
    <main>
      <NotificationsClient initial={initial} />
    </main>
  );
}
