"use client";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Tag = { id: number; name: string; slug: string };

export default function TagsClient({ list }: { list: Tag[] }) {
  const [items, setItems] = useState<Tag[]>(list);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();

  const canCreate = useMemo(() => !!name && !!slug && !items.some(t => t.slug === slug), [name, slug, items]);

  const create = () => startTransition(async () => {
    if (!canCreate) return;
    const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug }) });
    if (!res.ok) { toast.error('Failed to add'); return; }
    const tag: Tag = await res.json();
    setItems([tag, ...items]);
    setName(""); setSlug("");
    toast.success('Tag added');
  });

  const save = (id: number, data: Partial<Tag>) => startTransition(async () => {
    const current = items.find(t => t.id === id); if (!current) return;
    const updated = { ...current, ...data };
    const res = await fetch('/api/tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    if (!res.ok) { toast.error('Failed to save'); return; }
    const saved = await res.json();
    setItems(items.map(t => t.id === id ? saved : t));
    toast.success('Saved');
  });

  const remove = (id: number) => startTransition(async () => {
    if (!confirm('Delete this tag?')) return;
    const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    setItems(items.filter(t => t.id !== id));
    toast.success('Deleted');
  });

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tags</h1>
      </div>
      <div className="rounded border divide-y">
        <div className="grid grid-cols-5 gap-2 p-2 text-xs text-muted-foreground">
          <div>Name</div>
          <div>Slug</div>
          <div className="col-span-2">Preview</div>
          <div></div>
        </div>
        <div className="grid grid-cols-5 gap-2 p-2 items-center">
          <input className="border rounded px-2 py-1 text-sm" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Tag name" />
          <input className="border rounded px-2 py-1 text-sm" value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="tag-slug" />
          <div className="col-span-2 text-sm text-muted-foreground">/tag/{slug || 'example'}</div>
          <div className="text-right"><button className="px-2 py-1 border rounded text-xs" onClick={create} disabled={!canCreate || pending}>{pending ? '...' : 'Add'}</button></div>
        </div>
        {items.map((t) => (
          <div key={t.id} className="grid grid-cols-5 gap-2 p-2 items-center">
            <input className="border rounded px-2 py-1 text-sm" defaultValue={t.name} onBlur={(e)=>save(t.id, { name: e.currentTarget.value })} />
            <input className="border rounded px-2 py-1 text-sm" defaultValue={t.slug} onBlur={(e)=>save(t.id, { slug: e.currentTarget.value })} />
            <div className="col-span-2 text-sm text-muted-foreground">/tag/{t.slug}</div>
            <div className="text-right"><button className="px-2 py-1 border rounded text-xs text-red-600" onClick={()=>remove(t.id)}>Delete</button></div>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-sm text-muted-foreground">No tags yet.</div>}
      </div>
    </main>
  );
}
