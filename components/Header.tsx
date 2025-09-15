"use client";
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();
  const [q, setQ] = useState('');
  const router = useRouter();
  const isStudio = pathname?.startsWith('/studio');
  const mode = (theme === 'system' ? systemTheme : theme) === 'dark' ? 'dark' : 'light';
  const setCookieTheme = (val: 'light'|'dark'|'system') => {
    try { document.cookie = `vw_theme=${val}; Max-Age=${60*60*24*365}; Path=/`; } catch {}
  };
  const toggle = () => { const next = mode === 'dark' ? 'light' : 'dark'; setCookieTheme(next); setTheme(next); };

  if (isStudio) return null;

  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 dark:bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold">Voidwrite</Link>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">🔎</span>
            <input
              aria-label="search"
              className="pl-7 pr-2 py-1 rounded border bg-transparent w-52 text-sm"
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
              }}
            />
          </div>
          <button aria-label="Toggle theme" onClick={toggle} className="text-sm border rounded px-2 py-1">
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
