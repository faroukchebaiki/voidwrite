import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from '@/components/ui/sonner';
import { requireStaff } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { SuspendedWatcher } from '@/components/SuspendedWatcher';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  if (!user) return redirect('/signin');
  const role = (user as any)?.role as string | undefined;
  const sidebarUser = user as { id?: string | null; name?: string | null; email?: string | null; image?: string | null };
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" role={role} user={sidebarUser} />
      <SidebarInset>
        <SuspendedWatcher />
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
