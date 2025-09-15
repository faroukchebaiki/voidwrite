"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import RichEditor from "@/components/RichEditor";
import Image from "next/image";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function NewPostClient({ role }: { role?: string }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isAdmin = role === 'admin';

  const genId = useCallback(() => Math.random().toString(36).slice(2, 8), []);
  const genSlug = useCallback(() => `${dayjs().format("YYYYMMDD")}-${genId()}`, [genId]);

  const submit = useCallback(async (publish: boolean) => {
    const effSlug = genSlug();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug: effSlug, excerpt, content, status: publish && isAdmin ? "published" : "draft", coverImageUrl }),
    });
    if (!res.ok) { toast.error('Failed to save'); return; }
    const data = await res.json();
    location.href = `/studio/posts/${data.id}`;
  }, [title, excerpt, content, coverImageUrl, genSlug, isAdmin]);
  const onSave = useCallback(() => { void submit(false); }, [submit]);
  const onPublish = useCallback(() => { void submit(true); }, [submit]);

  useEffect(() => {
    const handleSave = () => onSave();
    const handlePublish = () => onPublish();
    window.addEventListener('voidwrite:save', handleSave);
    window.addEventListener('voidwrite:publish', handlePublish);
    return () => {
      window.removeEventListener('voidwrite:save', handleSave);
      window.removeEventListener('voidwrite:publish', handlePublish);
    };
  }, [onSave, onPublish]);

  const clickUpload = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const body = new FormData();
    body.append('file', f);
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) { toast.error('Upload failed'); return; }
    const { url } = await res.json();
    setCoverImageUrl(url);
    toast.success('Cover uploaded');
  };
  return (
    <div className="space-y-6">
        <div className="max-w-3xl mx-auto w-full space-y-3">
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
            <label className="block text-sm mb-1">Short description</label>
            <input className="w-full border rounded px-3 py-2" value={excerpt} onChange={(e)=>setExcerpt(e.target.value)} placeholder="Brief summary of the post" />
          </div>
          <div>
            <label className="block text-sm mb-1">Cover image</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clickUpload} className="px-3 py-1 border rounded text-sm">Upload cover image</button>
              <input ref={fileRef} onChange={onFile} type="file" accept="image/*" className="hidden" />
            </div>
            {coverImageUrl && (
              <div className="mt-2">
                <Image src={coverImageUrl} alt="Cover preview" width={800} height={450} className="max-h-48 rounded border w-auto h-auto" unoptimized />
              </div>
            )}
          </div>
        </div>
        <div className="max-w-3xl mx-auto w-full">
          <RichEditor initialHTML="" onChange={setContent} />
        </div>
        <div className="max-w-3xl mx-auto w-full flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={onSave}>Save draft</button>
          {isAdmin && <button className="px-3 py-2 border rounded" onClick={onPublish}>Publish</button>}
        </div>
      </div>
  );
}
