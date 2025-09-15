"use client"

import * as React from "react"
import { BellIcon, FileTextIcon, LayoutDashboardIcon, ListIcon, PlusCircleIcon, Tag as TagIcon, AlertCircle } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Voidwrite",
    email: "studio@voidwrite.local",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    { key: 'dashboard', title: "Dashboard", url: "/studio", icon: LayoutDashboardIcon },
    { key: 'notifications', title: "Notifications", url: "/studio/notifications", icon: BellIcon },
    { key: 'new', title: "New Post", url: "/studio/posts/new", icon: PlusCircleIcon },
    { key: 'pending', title: "Pending", url: "/studio/pending", icon: AlertCircle },
    { key: 'my', title: "My Posts", url: "/studio/my-blogs", icon: ListIcon },
    { key: 'all', title: "All Posts", url: "/studio/posts", icon: FileTextIcon },
    { key: 'tags', title: "Tags", url: "/studio/tags", icon: TagIcon },
    { key: 'invite', title: "Invite", url: "/studio/invite", icon: PlusCircleIcon },
  ],
}

export function AppSidebar({ role, ...props }: { role?: string } & React.ComponentProps<typeof Sidebar>) {
  const isAdmin = role === 'admin';
  const nav = isAdmin
    ? data.navMain
    : data.navMain.filter((i) => ['dashboard','new','my','notifications','settings'].includes(String(i.key)));
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <a href="/studio">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboardIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Studio</span>
                  <span className="truncate text-xs">voidwrite</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <React.Suspense fallback={null}>
          <NavMain items={nav} />
        </React.Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
