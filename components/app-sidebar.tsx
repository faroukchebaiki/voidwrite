"use client"

import * as React from "react"
import { BellIcon, FileTextIcon, LayoutDashboardIcon, ListIcon, PlusCircleIcon, Tag as TagIcon, AlertCircle } from "lucide-react"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', title: "Dashboard", url: "/studio", icon: LayoutDashboardIcon },
  { key: 'notifications', title: "Notifications", url: "/studio/notifications", icon: BellIcon },
  { key: 'new', title: "New Post", url: "/studio/posts/new", icon: PlusCircleIcon },
  { key: 'pending', title: "Pending", url: "/studio/pending", icon: AlertCircle },
  { key: 'my', title: "My Posts", url: "/studio/my-blogs", icon: ListIcon },
  { key: 'all', title: "All Posts", url: "/studio/posts", icon: FileTextIcon },
  { key: 'tags', title: "Tags", url: "/studio/tags", icon: TagIcon },
  { key: 'invite', title: "Invite", url: "/studio/invite", icon: PlusCircleIcon },
] as const;

type SidebarUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppSidebar({ role, user, ...props }: { role?: string; user?: SidebarUser } & React.ComponentProps<typeof Sidebar>) {
  const isAdmin = role === 'admin';
  const nav = isAdmin
    ? [...NAV_ITEMS]
    : NAV_ITEMS.filter((i) => ['dashboard','new','my','notifications'].includes(String(i.key)));
  const sidebarUser = {
    id: user?.id || null,
    name: user?.name || user?.email || 'Member',
    email: user?.email || '',
    avatar: user?.image || '',
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={sidebarUser} />
      </SidebarHeader>
      <SidebarContent>
        <React.Suspense fallback={null}>
          <NavMain items={nav} />
        </React.Suspense>
      </SidebarContent>
    </Sidebar>
  )
}
