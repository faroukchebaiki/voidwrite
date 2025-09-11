import Link from 'next/link';
import { auth } from '@/auth-app';
import SignOutButton from '@/components/SignOutButton';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const name = (session?.user as any)?.name as string | undefined;
  const email = (session?.user as any)?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;
  const displayName = name || (email ? email.split('@')[0] : 'User');
  let first = displayName;
  let last = '';
  if (name && name.includes(' ')) {
    const parts = name.split(' ');
    first = parts[0];
    last = parts.slice(1).join(' ');
  }
  return (
    <div className="min-h-screen flex" suppressHydrationWarning>
      <aside className="w-64 border-r flex flex-col">
        <div className="px-4 py-4 border-b">
          <h1 className="text-lg font-semibold">Voidwrite Dashboard</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link href="/studio/posts/new" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Write a blog</Link>
          <Link href="/studio/posts" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">{role === 'admin' ? 'All blogs' : 'My blogs'}</Link>
          <Link href="/studio/notifications" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Notifications</Link>
          {role === 'admin' && (
            <Link href="/studio/members" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Members</Link>
          )}
          <Link href="/studio/settings" className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Settings</Link>
        </nav>
        <div className="mt-auto px-4 py-4 border-t space-y-1 text-sm">
          <div className="font-medium">{first} {last}</div>
          {role && <div className="text-gray-500">{role}</div>}
          <div className="pt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
