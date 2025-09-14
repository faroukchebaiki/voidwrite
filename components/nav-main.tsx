"use client"

import Link from "next/link"
import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = { key?: 'dashboard'|'notifications'|'new'|'my'|'all'|string; title: string; url: string; icon?: LucideIcon };

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Compute a canonical active key based on route
  const activeKey = (() => {
    if (pathname === '/studio') return 'dashboard';
    if (pathname === '/studio/notifications') return 'notifications';
    if (pathname === '/studio/posts/new') return 'new';
    if (pathname === '/studio/myblogs') return 'my';
    if (pathname === '/studio/posts') return 'all';
    if (pathname === '/studio/invite') return 'invite';
    return undefined;
  })();
  // Ensure only one item is active at a time
  const activeIndex = (() => {
    if (activeKey) {
      const byKey = items.findIndex((it) => it.key === activeKey);
      if (byKey !== -1) return byKey;
    }
    const byUrl = items.findIndex((it) => it.url === pathname);
    return byUrl;
  })();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
