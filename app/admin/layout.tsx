import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="flex items-center justify-between border-b pb-2 mb-4 text-sm">
        <div className="flex gap-4">
          <Link href="/admin" className="underline">Overview</Link>
          <Link href="/admin/posts" className="underline">Posts</Link>
          <Link href="/admin/settings" className="underline">Settings</Link>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <SignOutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
