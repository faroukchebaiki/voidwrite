"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export type NotificationRow = {
  id: number;
  userId: string;
  type: string;
  payload: Record<string, any> | null;
  createdAt: string;
  readAt: string | null;
};

export default function NotificationsClient({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState<NotificationRow[]>(initial);
  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const markRead = async (ids: number[]) => {
    if (ids.length === 0) return;
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch {
      // ignore; optimistic update
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="divide-y overflow-hidden rounded-lg border">
        {items.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
        )}
        {items.map((notification) => {
          const isRead = Boolean(notification.readAt);
          const payload = notification.payload || {};
          const href = payload.postId ? `/studio/posts/${payload.postId}` : null;
          const primary = (() => {
            switch (notification.type) {
              case 'submission':
                return `Submitted post by ${payload.authorName || 'Contributor'}`;
              case 'approval':
                return `Post approved: ${payload.title || 'Untitled'}`;
              case 'assignment':
                return `Assigned post: ${payload.title || 'Untitled'}`;
              default:
                return notification.type;
            }
          })();
          const secondary = payload.title ? `Title: ${payload.title}` : null;
          const distance = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

          const Card = (
            <div
              className={`flex flex-col gap-2 p-4 transition-colors ${isRead ? 'bg-background' : 'bg-accent/20'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {!isRead && <span className="inline-flex size-2 rounded-full bg-primary" aria-hidden />}
                    <p className="text-sm font-medium text-foreground">{primary}</p>
                  </div>
                  {secondary && <p className="text-xs text-muted-foreground">{secondary}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{distance}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void markRead([notification.id])}
                  disabled={isRead}
                  className="text-xs"
                >
                  <Check className="size-3" />
                  Mark as read
                </Button>
                {href && (
                  <Link
                    href={href}
                    className="text-xs font-medium text-primary hover:text-primary/80"
                    onClick={() => void markRead([notification.id])}
                  >
                    Open post
                  </Link>
                )}
              </div>
            </div>
          );

          if (href) {
            return (
              <Link key={notification.id} href={href} className="block" onClick={() => void markRead([notification.id])}>
                {Card}
              </Link>
            );
          }
          return (
            <div key={notification.id}>
              {Card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
