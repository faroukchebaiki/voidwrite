"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

type Option = { id: string; label: string; image?: string | null };

export default function UserCombobox({
  value,
  onChange,
  placeholder = 'Search user…',
  className = '',
}: {
  value?: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const opts = data.map((u: any) => ({ id: u.id, label: u.name || u.email, image: u.image }));
        setOptions(opts);
      } catch {}
    })();
  }, []);

  const current = useMemo(() => options.find(o => o.id === value) || null, [options, value]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = q ? options.filter(o => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)) : options;
    return list.slice(0, 50);
  }, [options, query]);

  const commit = (o: Option) => {
    onChange(o.id);
    setOpen(false);
    setQuery('');
    setHighlight(0);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = filtered[highlight]; if (o) commit(o); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls="user-combobox-listbox"
        className="w-full border rounded px-3 py-2 flex items-center gap-2 text-left"
        onClick={() => setOpen(v => !v)}
      >
        {current?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.image} alt={current.label} className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <span className="h-5 w-5 rounded-full bg-muted inline-block" />
        )}
        <span className="flex-1 truncate text-sm">{current ? current.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="opacity-60"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded border bg-background shadow-sm" onKeyDown={onKeyDown}>
          <div className="p-2">
            <input
              autoFocus
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder={placeholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
            />
          </div>
          <ul id="user-combobox-listbox" role="listbox" aria-label="Users" ref={listRef} className="max-h-56 overflow-auto">
            {filtered.map((o, idx) => (
              <li
                role="option"
                aria-selected={idx === highlight}
                key={o.id}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/70 cursor-pointer ${idx===highlight ? 'bg-muted/60' : ''}`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => { e.preventDefault(); commit(o); }}
              >
                {o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt={o.label} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="h-6 w-6 rounded-full bg-muted inline-block" />
                )}
                <span className="truncate">{o.label}</span>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

