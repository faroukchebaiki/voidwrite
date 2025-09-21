"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function SiteHeader() {
  const pathname = usePathname();
  const isNewPost = pathname === "/studio/posts/new";
  const isEditPost = pathname?.startsWith("/studio/posts/") && pathname !== "/studio/posts/new";
  const showActions = isNewPost || isEditPost;
  const isMobile = useIsMobile();
  const [canSave, setCanSave] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canAssign, setCanAssign] = useState(false);
  const [publishLabel, setPublishLabel] = useState('Publish');
  const breadcrumbs = useMemo(() => {
    const items: Array<{ label: string; href: string }> = [
      { label: "Voidwrite Studio", href: "/studio" },
    ];
    if (!pathname || pathname === "/studio") return items;
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "studio") {
      return items;
    }
    let acc = "";
    segments.slice(1).forEach((segment, index, arr) => {
      acc += `/${segment}`;
      const href = `/studio${acc}`;
      const pretty = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .replace(/\bId\b/g, "ID");
      items.push({ label: pretty, href: index === arr.length - 1 ? pathname : href });
    });
    return items;
  }, [pathname]);
  const emit = (name: string) => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent(name));

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ canSave?: boolean; canPublish?: boolean; canDelete?: boolean; canAssign?: boolean; publishLabel?: string }>).detail || {};
      if (typeof detail.canSave === "boolean") setCanSave(detail.canSave);
      if (typeof detail.canPublish === "boolean") setCanPublish(detail.canPublish);
      if (typeof detail.canDelete === "boolean") setCanDelete(detail.canDelete);
      if (typeof detail.canAssign === "boolean") setCanAssign(detail.canAssign);
      if (typeof detail.publishLabel === 'string') setPublishLabel(detail.publishLabel);
    };
    window.addEventListener("voidwrite:actions-state", handler);
    window.dispatchEvent(new CustomEvent('voidwrite:request-actions-state'));
    return () => {
      window.removeEventListener("voidwrite:actions-state", handler);
      setCanSave(false);
      setCanPublish(false);
      setCanDelete(false);
      setCanAssign(false);
      setPublishLabel('Publish');
    };
  }, [pathname]);

  const onSave = () => emit('voidwrite:save');
  const onPublish = () => emit('voidwrite:publish');
  const onPreview = () => emit('voidwrite:preview');
  const onDelete = () => emit('voidwrite:delete');
  const onAssign = () => emit('voidwrite:assign');
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={crumb.href} className="flex items-center gap-2 text-muted-foreground">
                {idx > 0 && <span>/</span>}
                {isLast ? (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:underline">
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {showActions && !isMobile && (
            <>
              <Button size="sm" variant="outline" onClick={onSave} disabled={!canSave}>Save</Button>
              <Button size="sm" onClick={onPublish} disabled={!canPublish}>{publishLabel}</Button>
            </>
          )}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={isMobile ? "sm" : "icon"} variant="outline" aria-label="More actions" className={isMobile ? "" : "size-8"}>
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {isMobile && (
                  <>
                    <DropdownMenuItem disabled={!canSave} onSelect={onSave}>Save</DropdownMenuItem>
                    <DropdownMenuItem disabled={!canPublish} onSelect={onPublish}>{publishLabel}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={onPreview}>Preview</DropdownMenuItem>
                {canAssign && <DropdownMenuItem onSelect={onAssign}>Assign</DropdownMenuItem>}
                <DropdownMenuItem disabled={!canDelete} className="text-destructive focus:text-destructive" onSelect={onDelete}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
