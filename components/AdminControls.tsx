"use client";

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Option = { id: string; label: string };

export default function AdminControls({
  targetId,
  targetRole,
  suspended,
  options,
}: {
  targetId: string;
  targetRole: string;
  suspended: boolean;
  options: Option[];
}) {
  const [role, setRole] = useState(targetRole);
  const [savingRole, setSavingRole] = useState(false);
  const [status, setStatus] = useState<'active' | 'suspended'>(suspended ? 'suspended' : 'active');
  const [statusSaving, setStatusSaving] = useState(false);
  const [transferTo, setTransferTo] = useState(options[0]?.id || '');
  const [deleting, setDeleting] = useState(false);

  const roleDirty = role !== targetRole;

  const hasTransferOptions = options.length > 0;

  const onSaveRole = async () => {
    if (!roleDirty || savingRole) return;
    setSavingRole(true);
    try {
      const res = await fetch(`/api/users/${targetId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Role updated');
      location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  const onStatusChange = async (next: 'active' | 'suspended') => {
    if (statusSaving || next === status) return;
    setStatus(next);
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/users/${targetId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended: next === 'suspended' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(next === 'suspended' ? 'Member suspended' : 'Member reactivated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
      setStatus(next === 'suspended' ? 'active' : 'suspended');
    } finally {
      setStatusSaving(false);
    }
  };

  const onDelete = async () => {
    if (!transferTo) {
      toast.error('Select a transfer target');
      return;
    }
    if (!confirm('Delete this user and transfer their content?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${targetId}?transferTo=${encodeURIComponent(transferTo)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('User deleted');
      location.href = '/studio/members';
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const statusLabel = useMemo(() => (status === 'suspended' ? 'Suspended' : 'Active'), [status]);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Admin Controls</h2>
      <div className="divide-y overflow-hidden rounded-lg border">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Role</p>
            <p className="text-xs text-muted-foreground">Toggle between admin and author access.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              value={role}
              onValueChange={(value) => value && setRole(value)}
              className="border"
            >
              <ToggleGroupItem value="admin" className="px-4 py-1.5 text-sm">Admin</ToggleGroupItem>
              <ToggleGroupItem value="editor" className="px-4 py-1.5 text-sm">Author</ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" variant="outline" disabled={!roleDirty || savingRole} onClick={onSaveRole}>
              {savingRole ? 'Saving…' : 'Apply'}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Account status</p>
            <p className="text-xs text-muted-foreground">Set whether this member can sign in.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              value={status}
              onValueChange={(value) => value && onStatusChange(value as 'active' | 'suspended')}
              className="border"
            >
              <ToggleGroupItem value="active" className="px-4 py-1.5 text-sm">Active</ToggleGroupItem>
              <ToggleGroupItem value="suspended" className="px-4 py-1.5 text-sm">Suspended</ToggleGroupItem>
            </ToggleGroup>
            <span className="text-xs text-muted-foreground">
              {statusSaving ? 'Updating…' : statusLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">Delete member</p>
            <p className="text-xs text-muted-foreground">
              Transfer ownership of their drafts and published posts before removal.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <select
              className="w-full min-w-[180px] rounded-md border px-3 py-1.5 text-sm"
              value={transferTo}
              onChange={(event) => setTransferTo(event.target.value)}
              disabled={!hasTransferOptions || deleting}
            >
              {options.length === 0 && <option value="">No recipients available</option>}
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="destructive"
              disabled={!transferTo || deleting}
              onClick={onDelete}
            >
              {deleting ? 'Deleting…' : 'Delete & transfer'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
