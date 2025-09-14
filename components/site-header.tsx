"use client";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const isNewPost = pathname === "/studio/posts/new";
  const isPostsList = pathname === "/studio/posts" || pathname === "/studio/myblogs";
  const isEditPost = pathname.startsWith("/studio/posts/") && !isNewPost;
  const isSettings = pathname.startsWith("/studio/settings");
  const title = isNewPost
    ? "New Post"
    : isPostsList
    ? (pathname === "/studio/myblogs" ? "My blogs" : "All blogs")
    : isEditPost
    ? "Edit Post"
    : isSettings
    ? "Settings"
    : "Studio";
  const emit = (name: string) => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent(name));
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {isNewPost && (
            <>
              <Button size="sm" variant="outline" onClick={() => emit('voidwrite:save')}>Save</Button>
              <Button size="sm" onClick={() => emit('voidwrite:publish')}>Publish</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
