"use client";
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminControls({ targetId, currentRole, options }: {
  targetId: string;
  currentRole: string;
  options: Array<{ id: string; label: string }>;
}) {
  const [role, setRole] = useState(currentRole);
  const [transferTo, setTransferTo] = useState(options[0]?.id || '');

  const onSaveRole = async () => {
    const res = await fetch(`/api/users/${targetId}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (res.ok) { toast.success('Role updated'); location.reload(); } else toast.error('Failed to update role');
  };
  const onSuspend = async (s: boolean) => {
    const res = await fetch(`/api/users/${targetId}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suspended: s }) });
    if (res.ok) { toast.success(s ? 'Suspended' : 'Unsuspended'); location.reload(); } else toast.error('Failed');
  };
  const onDelete = async () => {
    if (!transferTo) { toast.error('Select a transfer target'); return; }
    if (!confirm('Delete this user and transfer posts?')) return;
    const res = await fetch(`/api/users/${targetId}?transferTo=${encodeURIComponent(transferTo)}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User deleted'); location.href = '/studio/members'; } else toast.error('Failed to delete');
  };

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Admin Controls</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <div className="border rounded p-3 space-y-2">
          <div className="text-sm font-medium">Role</div>
          <select className="w-full border rounded px-2 py-1" value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="editor">Author</option>
          </select>
          <button className="px-2 py-1 border rounded text-sm" onClick={onSaveRole}>Save</button>
        </div>
        <div className="border rounded p-3 space-y-2">
          <div className="text-sm font-medium">Suspend</div>
          <div className="flex gap-2">
            <button className="px-2 py-1 border rounded text-sm" onClick={()=>onSuspend(true)}>Suspend</button>
            <button className="px-2 py-1 border rounded text-sm" onClick={()=>onSuspend(false)}>Unsuspend</button>
          </div>
        </div>
        <div className="border rounded p-3 space-y-2">
          <div className="text-sm font-medium">Delete user</div>
          <label className="text-xs">Transfer content to:</label>
          <select className="w-full border rounded px-2 py-1" value={transferTo} onChange={(e)=>setTransferTo(e.target.value)}>
            {options.map((o)=> <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button className="px-2 py-1 border rounded text-sm text-red-600" onClick={onDelete}>Delete and transfer</button>
        </div>
      </div>
    </section>
  );
}

