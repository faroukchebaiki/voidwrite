"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import RichEditor from "@/components/RichEditor";
import Image from "next/image";
import UserCombobox from "@/components/UserCombobox";

export default function PostEditor({ initial, role, uid }: { initial: any; role?: string; uid?: string }) {
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [excerpt, setExcerpt] = useState(initial.excerpt || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl || "");
  const [content, setContent] = useState(initial.content || "");
  const [status, setStatus] = useState(initial.status || "draft");
  const [adminNote, setAdminNote] = useState(initial.adminNote || "");
  const [saving, setSaving] = useState(false);
  const html = content || "";
  const isAdmin = role === 'admin';
  const canDelete = isAdmin || (String(status) === 'draft' && initial.authorId === uid && !initial.assignedTo);
  const [assignee, setAssignee] = useState("");
  useEffect(()=>{ /* preload no longer needed for UserSelect */ }, []);
  const onAssign = async () => {
    if (!assignee) return;
    const res = await fetch(`/api/posts/${initial.id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTo: assignee }) });
    if (res.ok) { toast.success('Assigned'); location.reload(); } else toast.error('Assign failed');
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, excerpt, coverImageUrl, content, status, adminNote }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success('Saved');
      location.reload();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${initial.id}`, { method: "DELETE" });
    if (res.ok) { toast.success('Deleted'); location.href = "/studio/posts"; }
  };
  const onSubmitForReview = async () => {
    const res = await fetch(`/api/posts/${initial.id}/submit`, { method: 'POST' });
    if (res.ok) { toast.success('Submitted for review'); location.reload(); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Post</h1>
        <div className="flex gap-2 items-center">
          <Link href="/studio/posts" className="text-sm underline">Back</Link>
          {canDelete && <button onClick={onDelete} className="text-sm text-red-600">Delete</button>}
          {!isAdmin && String(status) !== 'published' && <button onClick={onSubmitForReview} className="text-sm">Submit for review</button>}
          <span className="ml-auto text-xs px-2 py-1 rounded border capitalize">Status: {String(status)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {isAdmin && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm mb-1">Assign to</label>
                <UserCombobox value={assignee} onChange={setAssignee} />
              </div>
              <button className="h-10 px-3 border rounded" onClick={onAssign}>Assign</button>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
              placeholder="Write a clear, short title…"
              aria-label="Post title"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input className="w-full border rounded px-3 py-2" value={slug} onChange={(e)=>setSlug(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Excerpt</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={excerpt}
              onChange={(e)=>setExcerpt(e.target.value)}
              placeholder="Brief summary of the post"
              aria-label="Short description"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Cover image URL</label>
            <input className="w-full border rounded px-3 py-2" value={coverImageUrl} onChange={(e)=>setCoverImageUrl(e.target.value)} placeholder="https://..." />
            {coverImageUrl && (
              <div className="mt-2">
                <Image src={coverImageUrl} alt="Cover preview" width={800} height={450} className="max-h-48 rounded border w-auto h-auto" unoptimized />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select className="w-full border rounded px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value as any)} disabled={!isAdmin}>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Content</label>
            <RichEditor initialHTML={html} onChange={setContent} />
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm mb-1">Admin note</label>
              <textarea className="w-full border rounded px-3 py-2" rows={4} value={adminNote} onChange={(e)=>setAdminNote(e.target.value)} placeholder="Notes for assignment or review" />
            </div>
          )}
          <div className="flex gap-2">
            <button disabled={saving} onClick={onSave} className="border rounded px-3 py-2">{saving ? 'Saving…' : 'Save'}</button>
            {isAdmin && String(status) !== 'published' && <button className="border rounded px-3 py-2" onClick={async ()=>{ const r= await fetch(`/api/posts/${initial.id}/publish`, { method: 'POST' }); if(r.ok) location.reload(); }}>Publish</button>}
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
