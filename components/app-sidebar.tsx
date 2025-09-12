"use client"

import * as React from "react"
import { BellIcon, FileTextIcon, LayoutDashboardIcon, ListIcon, PlusCircleIcon } from "lucide-react"

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
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    { key: 'dashboard', title: "Dashboard", url: "/studio", icon: LayoutDashboardIcon },
    { key: 'notifications', title: "Notifications", url: "/studio/notifications", icon: BellIcon },
    { key: 'new', title: "New Post", url: "/studio/posts/new", icon: PlusCircleIcon },
    { key: 'my', title: "My blogs", url: "/studio/myblogs", icon: ListIcon },
    { key: 'all', title: "All blogs", url: "/studio/posts", icon: FileTextIcon },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          <NavMain items={data.navMain} />
        </React.Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
