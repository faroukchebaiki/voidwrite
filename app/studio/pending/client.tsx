"use client";
import { useState } from 'react';
import { toast } from 'sonner';
import UserCombobox from '@/components/UserCombobox';

type Item = { id: number; title: string; slug: string; author: string; submittedAt?: string; adminNote?: string | null; assignedTo?: string | null };

export default function PendingClient({ items }: { items: Item[] }) {
  const [rows, setRows] = useState(items);
  const publish = async (id: number) => {
    const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
    if (res.ok) { toast.success('Published'); location.reload(); } else toast.error('Failed to publish');
  };
  const saveNote = async (id: number, note: string) => {
    const trimmed = note.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/posts/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: trimmed }),
    });
    if (res.ok) {
      toast.success('Note saved');
    } else {
      const msg = await res.text().catch(() => 'Failed to save note');
      toast.error(msg || 'Failed to save note');
    }
  };
  const reassign = async (id: number, to: string) => {
    const res = await fetch(`/api/posts/${id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTo: to }) });
    if (res.ok) { toast.success('Reassigned'); location.reload(); } else toast.error('Failed to reassign');
  };
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Pending Posts</h1>
      <div className="rounded border divide-y">
        <div className="grid grid-cols-6 gap-2 p-2 text-xs text-muted-foreground">
          <div>Title</div>
          <div>Author</div>
          <div>Submitted</div>
          <div>Note</div>
          <div>Assign</div>
          <div></div>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-6 gap-2 p-2 items-center">
            <a href={`/studio/posts/${r.id}`} className="underline truncate">{r.title}</a>
            <div className="text-sm truncate">{r.author}</div>
            <div className="text-sm">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</div>
            <div>
              <input defaultValue={r.adminNote || ''} onBlur={(e)=>saveNote(r.id, e.currentTarget.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Add a note" />
            </div>
            <div>
              <UserCombobox value={r.assignedTo || undefined} onChange={(id)=>reassign(r.id, id)} />
            </div>
            <div className="flex justify-end">
              <button className="px-2 py-1 border rounded text-xs" onClick={()=>publish(r.id)}>Publish</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="p-3 text-sm text-muted-foreground">No pending posts.</div>}
      </div>
    </main>
  );
}
