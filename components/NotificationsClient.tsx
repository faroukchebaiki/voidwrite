"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@/components/ui/button";

dayjs.extend(relativeTime);

export type NotificationRow = {
  id: number;
  userId: string;
  type: string;
  payload: Record<string, any> | null;
  createdAt: string;
  readAt: string | null;
};

export default function NotificationsClient({ initial }: { initial: NotificationRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>(initial);
  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const markRead = useCallback(async (ids: number[]) => {
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
  }, []);

  useEffect(() => {
    const unreadIds = initial.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length > 0) {
      void markRead(unreadIds);
    }
  }, [initial, markRead]);

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
          const actorFullName = (() => {
            const first = (payload.actorFirstName as string | undefined)?.toString().trim();
            const last = (payload.actorLastName as string | undefined)?.toString().trim();
            const combined = [first, last].filter(Boolean).join(' ');
            return combined || (payload.actorName as string | undefined) || 'Member';
          })();
          const payloadType = (payload.kind as string | undefined) ?? notification.type;
          const primary = (() => {
            switch (payloadType) {
              case 'submission':
                return `Submission by ${actorFullName}`;
              case 'approval':
                return `Post approved by ${actorFullName}`;
              case 'assignment':
                return `Assignment by ${actorFullName}`;
              case 'comment':
                return `Comment from ${actorFullName}`;
              case 'note':
                return `Note from ${actorFullName}`;
              default:
                return notification.type;
            }
          })();
          const secondaryLines: string[] = [];
          if (payload.title) secondaryLines.push(`Title: ${payload.title}`);
          if (payloadType === 'assignment' && payload.assignedToName) {
            secondaryLines.push(`Assigned to: ${payload.assignedToName}`);
          }
          if (payloadType === 'assignment' && payload.note) {
            secondaryLines.push(`Note: ${payload.note}`);
          }
          if (payloadType === 'comment' && payload.note) {
            secondaryLines.push(`Comment: ${payload.note}`);
          }
          const secondary = secondaryLines.length ? secondaryLines.join('\n') : null;
          const distance = dayjs(notification.createdAt).isValid()
            ? dayjs(notification.createdAt).fromNow()
            : "";

          const handleNavigate = async () => {
            if (!href) return;
            await markRead([notification.id]);
            router.push(href);
          };

          const handleKeyDown = async (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!href) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              await handleNavigate();
            }
          };

          const CardContent = (
            <div
              className={`flex flex-col gap-2 p-4 transition-colors ${isRead ? 'bg-background' : 'bg-accent/20'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {!isRead && <span className="inline-flex size-2 rounded-full bg-primary" aria-hidden />}
                    <p className="text-sm font-medium text-foreground">{primary}</p>
                  </div>
                  {secondary && (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                      {secondary}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{distance}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    void markRead([notification.id]);
                  }}
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
                    onClick={(event) => {
                      event.stopPropagation();
                      void markRead([notification.id]);
                    }}
                  >
                    Open post
                  </Link>
                )}
              </div>
            </div>
          );

          if (href) {
            return (
              <div
                key={notification.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={handleNavigate}
                onKeyDown={handleKeyDown}
              >
                {CardContent}
              </div>
            );
          }
          return (
            <div key={notification.id}>
              {CardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
