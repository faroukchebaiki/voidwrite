import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/auth-app';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const user = session?.user as { id?: string | null; name?: string | null; email?: string | null; image?: string | null } | undefined;
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" role={role} user={user} />
      <SidebarInset>
        <React.Suspense fallback={null}>
          <SiteHeader />
        </React.Suspense>
        <div className="flex-1 p-2 md:p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
      <Toaster position="bottom-center" richColors closeButton />
    </SidebarProvider>
  );
}
