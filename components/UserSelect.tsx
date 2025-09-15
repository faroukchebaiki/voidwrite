"use client";
import { useEffect, useMemo, useState } from 'react';

type Option = { id: string; label: string; image?: string | null };

export default function UserSelect({
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const opts = data.map((u: any) => ({ id: u.id, label: u.name || u.email, image: u.image }));
        setOptions(opts);
        if (value) {
          const found = opts.find((o: Option) => o.id === value) || null;
          setSelected(found);
        }
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [options, query]);

  const pick = (o: Option) => {
    setSelected(o);
    setOpen(false);
    onChange(o.id);
  };

  return (
    <div className={`relative ${className}`}>
      <button type="button" className="w-full border rounded px-3 py-2 flex items-center gap-2 text-left" onClick={() => setOpen((v) => !v)}>
        {selected?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.image} alt={selected.label} className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <span className="h-5 w-5 rounded-full bg-muted inline-block" />
        )}
        <span className="flex-1 truncate text-sm">{selected ? selected.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="opacity-60"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded border bg-background shadow-sm">
          <div className="p-2">
            <input autoFocus className="w-full border rounded px-2 py-1 text-sm" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="max-h-56 overflow-auto">
            {filtered.map((o) => (
              <button type="button" key={o.id} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/70" onClick={() => pick(o)}>
                {o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt={o.label} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="h-6 w-6 rounded-full bg-muted inline-block" />
                )}
                <span className="truncate">{o.label}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}

