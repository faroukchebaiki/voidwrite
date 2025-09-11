"use client";
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/studio')) return null;
  return (
    <footer className="border-t mt-6 py-4">
      <div className="mx-auto max-w-6xl px-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Voidwrite. All rights reserved.
      </div>
    </footer>
  );
}
