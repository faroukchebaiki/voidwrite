"use client"

import { useEffect, useState } from "react";
import { LogOutIcon, MoreVerticalIcon, UsersIcon, SettingsIcon } from "lucide-react"
import { signOut } from "next-auth/react"
import { siteConfig } from "@/site";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    id?: string | null
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const displayName = (user.name && user.name.trim()) || user.email || `${siteConfig.title} member`;
  const displayEmail = user.email || '';
  const placeholder = "https://github.com/shadcn.png";
  const [avatar, setAvatar] = useState<string>(user.avatar || placeholder);
  const storageKey = user.id ? `profile_avatar_url_${user.id}` : null;
  useEffect(() => {
    const base = user.avatar || placeholder;
    setAvatar(base);
    if (typeof window === 'undefined') return;
    try {
      if (storageKey) {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) setAvatar(stored);
        const onStorage = (e: StorageEvent) => {
          if (e.key === storageKey) {
            setAvatar(e.newValue || base);
          }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
      }
      return undefined;
    } catch {}
  }, [storageKey, user.avatar, placeholder]);

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'VW';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={avatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={displayName} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (location.href = "/studio/members")}>
              <UsersIcon />
              Team
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => (location.href = "/studio/settings")}>
              <SettingsIcon />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/signin" })}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
