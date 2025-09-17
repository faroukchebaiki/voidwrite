"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RichEditor from "@/components/RichEditor";
import Image from "next/image";
import dayjs from "dayjs";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  username?: string | null;
  role?: string | null;
  suspended?: boolean;
};

export default function NewPostClient({ role }: { role?: string }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isAdmin = role === 'admin';

  const genId = useCallback(() => Math.random().toString(36).slice(2, 8), []);
  const genSlug = useCallback(() => `${dayjs().format("YYYYMMDD")}-${genId()}`, [genId]);

  const hasTitle = useMemo(() => title.trim().length > 0, [title]);
  const hasContent = useMemo(
    () => (content || "").replace(/<[^>]*>/g, "").trim().length > 0,
    [content]
  );
  const isComplete = hasTitle && hasContent;

  const emitActionState = useCallback((canSave: boolean, canPublish: boolean, canAssign: boolean) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('voidwrite:actions-state', {
          detail: { canSave, canPublish, canDelete: false, canAssign },
        })
      );
    }
  }, []);

  useEffect(() => {
    emitActionState(isComplete, isAdmin && isComplete, isAdmin && hasTitle);
  }, [emitActionState, isAdmin, isComplete, hasTitle]);

  useEffect(() => () => emitActionState(false, false, false), [emitActionState]);

  const submit = useCallback(
    async (
      publish: boolean,
      options?: { redirect?: boolean; allowEmptyContent?: boolean }
    ) => {
      if (!hasTitle) {
        toast.error('Add a title before continuing.');
        return null;
      }
      if (!hasContent && !options?.allowEmptyContent) {
        toast.error('Fill in title and content before continuing.');
        return null;
      }
      const effSlug = genSlug();
      const bodyContent = hasContent ? content : ' ';
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: effSlug,
          excerpt,
          content: bodyContent,
          status: publish && isAdmin ? "published" : "draft",
          coverImageUrl,
          seoKeywords: seoKeywords.trim() ? seoKeywords.trim() : null,
        }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => 'Failed to save');
        toast.error(message || 'Failed to save');
        return null;
      }
      const data = await res.json();
      if (options?.redirect === false) {
        return data;
      }
      location.href = `/studio/posts/${data.id}`;
      return data;
    },
    [content, coverImageUrl, excerpt, genSlug, hasContent, hasTitle, isAdmin, seoKeywords, title]
  );
  const onSave = useCallback(() => {
    void submit(false);
  }, [submit]);
  const onPublish = useCallback(() => {
    void submit(true);
  }, [submit]);

  const loadTeam = useCallback(async () => {
    if (teamLoading) return;
    setTeamLoading(true);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load team');
      const data = await res.json();
      const mapped: TeamMember[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.email || u.username || 'Unknown',
        email: u.email || null,
        username: u.username,
        role: u.role,
        suspended: u.suspended,
      }));
      setTeamMembers(mapped);
      setTeamLoaded(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load team');
    } finally {
      setTeamLoading(false);
    }
  }, [teamLoading]);

  const filteredTeam = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return teamMembers;
    return teamMembers.filter((member) => {
      const haystack = [member.name || '', member.email || '', member.username || '', member.role || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [assignSearch, teamMembers]);

  useEffect(() => {
    const handleSave = () => {
      void onSave();
    };
    const handlePublish = () => {
      void onPublish();
    };
    const handlePreview = () => setPreviewOpen(true);
    const handleAssign = () => {
      if (!isAdmin) {
        toast.error('Only admins can assign posts.');
        return;
      }
      if (!hasTitle) {
        toast.error('Add a title before assigning.');
        return;
      }
      if (!teamLoaded) void loadTeam();
      setAssignOpen(true);
    };
    window.addEventListener('voidwrite:save', handleSave);
    window.addEventListener('voidwrite:publish', handlePublish);
    window.addEventListener('voidwrite:preview', handlePreview);
    window.addEventListener('voidwrite:assign', handleAssign);
    return () => {
      window.removeEventListener('voidwrite:save', handleSave);
      window.removeEventListener('voidwrite:publish', handlePublish);
      window.removeEventListener('voidwrite:preview', handlePreview);
      window.removeEventListener('voidwrite:assign', handleAssign);
    };
  }, [onSave, onPublish, isAdmin, hasTitle, loadTeam, teamLoaded]);

  useEffect(() => {
    if (!assignOpen) return;
    setAssignSearch('');
    setAssignNote('');
    setSelectedAssignee('');
    if (!teamLoaded) {
      void loadTeam();
    }
  }, [assignOpen, loadTeam, teamLoaded]);

  const clickUpload = useCallback(() => fileRef.current?.click(), []);
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

  const onAssignToUser = useCallback(async () => {
    if (!selectedAssignee) {
      toast.error('Select a team member to assign');
      return;
    }
    setAssigning(true);
    try {
      const created = await submit(false, { redirect: false, allowEmptyContent: true });
      if (!created?.id) {
        throw new Error('Failed to save draft before assigning');
      }
      const payload: Record<string, any> = { assignedTo: selectedAssignee };
      const note = assignNote.trim();
      if (note) payload.note = note;
      const res = await fetch(`/api/posts/${created.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to assign');
      }
      toast.success('Post created and assigned');
      setAssignOpen(false);
      location.href = `/studio/posts/${created.id}`;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  }, [assignNote, selectedAssignee, submit]);
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
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
          <label className="block text-sm mb-1">SEO keywords</label>
          <input className="w-full border rounded px-3 py-2" value={seoKeywords} onChange={(e)=>setSeoKeywords(e.target.value)} placeholder="keyword one, keyword two" />
          <p className="mt-1 text-xs text-muted-foreground">Separate keywords with commas for better SEO metadata.</p>
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
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-3 py-6 md:px-6 md:py-10">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-lg border bg-background shadow-2xl">
              <button aria-label="Close preview" onClick={() => setPreviewOpen(false)} className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-sm text-white">✕</button>
              <div className="max-h-[80vh] overflow-y-auto">
                <article className="prose dark:prose-invert max-w-none px-5 py-6">
                  {coverImageUrl && (
                    <div className="mb-4 overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImageUrl} alt="Cover" className="w-full object-cover" />
                    </div>
                  )}
                  <h1 className="mb-2 text-3xl font-semibold">{title || 'Untitled post'}</h1>
                {excerpt && <p className="text-muted-foreground">{excerpt}</p>}
                {seoKeywords.trim() && (
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Keywords: {seoKeywords}</p>
                )}
                  <div className="mt-4" dangerouslySetInnerHTML={{ __html: content }} />
                </article>
              </div>
            </div>
          </div>
        )}
        {assignOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-3 py-6 md:px-6 md:py-10">
            <div className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-background shadow-2xl">
              <button aria-label="Close assign" onClick={() => setAssignOpen(false)} className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-sm text-white">✕</button>
              <div className="max-h-[80vh] overflow-y-auto space-y-4 p-5">
                <div>
                  <h2 className="text-lg font-semibold">Assign Post</h2>
                  <p className="text-sm text-muted-foreground">Create the draft and assign it to a teammate.</p>
                </div>
                <div>
                  <label className="block text-sm mb-1">Search team</label>
                  <input
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="Search by name, email, or username"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto rounded border">
                  {teamLoading && <div className="px-3 py-4 text-sm text-muted-foreground">Loading team…</div>}
                  {!teamLoading && filteredTeam.length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground">No team members found.</div>
                  )}
                  {!teamLoading && filteredTeam.length > 0 && (
                    <ul className="divide-y">
                      {filteredTeam.map((member) => {
                        const isSelected = selectedAssignee === member.id;
                        return (
                          <li key={member.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedAssignee(member.id)}
                              className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                                isSelected ? 'bg-accent/60' : ''
                              }`}
                            >
                              <span className="flex-1">
                                <span className="font-medium">{member.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {member.email || member.username || 'No email'}
                                </span>
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">{member.role || ''}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Note</label>
                  <textarea
                    className="w-full rounded border px-3 py-2 text-sm"
                    rows={3}
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                    placeholder="Add context for the assignee (optional)"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setAssignOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded border px-3 py-2 text-sm"
                    onClick={onAssignToUser}
                    disabled={!selectedAssignee || assigning}
                  >
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
