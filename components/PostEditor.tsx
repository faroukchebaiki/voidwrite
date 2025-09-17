"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import RichEditor from "@/components/RichEditor";

type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  username?: string | null;
  role?: string | null;
  suspended?: boolean;
};

type PostNote = {
  id: number;
  note: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

type PostEditorProps = {
  initial: any;
  role?: string;
  uid?: string;
  notes: PostNote[];
};

export default function PostEditor({ initial, role, uid, notes: initialNotes }: PostEditorProps) {
  const router = useRouter();
  const isAdmin = role === "admin";

  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [excerpt, setExcerpt] = useState(initial.excerpt || "");
  const [seoKeywords, setSeoKeywords] = useState(initial.seoKeywords || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl || "");
  const [content, setContent] = useState(initial.content || "");
  const [status, setStatus] = useState<string>(String(initial.status || "draft"));
  const [notes, setNotes] = useState<PostNote[]>(initialNotes || []);
  const [noteDraft, setNoteDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignNote, setAssignNote] = useState(initial.adminNote || "");
  const [assigning, setAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(initial.assignedTo || "");
  const [currentAssigneeId, setCurrentAssigneeId] = useState<string | null>(initial.assignedTo ?? null);
  const [currentAssigneeName, setCurrentAssigneeName] = useState<string | null>(
    initial.assignedToName || null
  );

  const fileRef = useRef<HTMLInputElement>(null);

  const hasTitle = useMemo(() => title.trim().length > 0, [title]);
  const hasContent = useMemo(
    () => (content || "").replace(/<[^>]*>/g, "").trim().length > 0,
    [content]
  );
  const isComplete = hasTitle && hasContent;

  const deleteAllowed = useMemo(
    () => canDeletePermission(initial, status, currentAssigneeId, uid, role),
    [currentAssigneeId, initial, role, status, uid]
  );

  const slugify = useCallback(
    (value: string) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, ""),
    []
  );

  const emitActionState = useCallback(
    (canSave: boolean, canPublish: boolean, canAssign: boolean) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("voidwrite:actions-state", {
            detail: { canSave, canPublish, canDelete: deleteAllowed, canAssign },
          })
        );
      }
    },
    [deleteAllowed]
  );

  useEffect(() => {
    emitActionState(true, isAdmin && isComplete && status !== "published", isAdmin && hasTitle);
  }, [emitActionState, isAdmin, isComplete, hasTitle, status, deleteAllowed]);

  useEffect(() => () => emitActionState(false, false, false), [emitActionState]);

  const loadTeam = useCallback(async () => {
    if (teamLoading) return;
    setTeamLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load team");
      const data = await res.json();
      const mapped: TeamMember[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.email || u.username || "Unknown",
        email: u.email || null,
        username: u.username,
        role: u.role,
        suspended: u.suspended,
      }));
      setTeamMembers(mapped);
      setTeamLoaded(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load team");
    } finally {
      setTeamLoading(false);
    }
  }, [teamLoading]);

  const filteredTeam = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return teamMembers;
    return teamMembers.filter((member) => {
      const haystack = [member.name || "", member.email || "", member.username || "", member.role || ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [assignSearch, teamMembers]);

  useEffect(() => {
    if (!assignOpen) return;
    setAssignSearch("");
    setAssignNote("");
    setSelectedAssignee(currentAssigneeId || "");
  }, [assignOpen, currentAssigneeId]);

  const clickUpload = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setCoverImageUrl(url);
      toast.success("Cover uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeCover = () => setCoverImageUrl("");

  const onSave = useCallback(async () => {
    if (!hasTitle) {
      toast.error("Add a title before saving.", { position: "bottom-center" });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const nextSlug = slug.trim() || slugify(title);
      if (!nextSlug) {
        toast.error("Provide a valid slug.", { position: "bottom-center" });
        return;
      }
      const res = await fetch(`/api/posts/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: nextSlug,
          excerpt,
          content,
          coverImageUrl,
          seoKeywords: seoKeywords.trim() ? seoKeywords.trim() : null,
        }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "Failed to save");
        throw new Error(message || "Failed to save");
      }
      if (isAdmin && noteDraft.trim()) {
        const noteRes = await fetch(`/api/posts/${initial.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: noteDraft.trim() }),
        });
        if (noteRes.ok) {
          const created = await noteRes.json();
          setNotes((prev) => [created, ...prev]);
          setNoteDraft("");
        } else {
          const msg = await noteRes.text();
          toast.error(msg || "Failed to save note", { position: "bottom-center" });
        }
      }
      setSlug(nextSlug);
      toast.success("Post saved", { position: "bottom-center" });
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save", { position: "bottom-center" });
    } finally {
      setSaving(false);
    }
  }, [content, coverImageUrl, excerpt, hasTitle, initial.id, isAdmin, noteDraft, router, saving, seoKeywords, slug, slugify, title]);

  const onPublish = useCallback(async () => {
    if (!isAdmin || publishing) return;
    if (!isComplete) {
      toast.error("Fill in title and content before publishing.", { position: "bottom-center" });
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/posts/${initial.id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to publish");
      toast.success("Post published", { position: "bottom-center" });
      setStatus("published");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish", { position: "bottom-center" });
    } finally {
      setPublishing(false);
    }
  }, [initial.id, isAdmin, isComplete, publishing, router]);

  const onDelete = useCallback(async () => {
    if (!deleteAllowed) return;
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Post deleted", { position: "bottom-center" });
      location.href = "/studio/posts";
    } else {
      toast.error("Failed to delete", { position: "bottom-center" });
    }
  }, [deleteAllowed, initial.id]);

  const onAssignToUser = useCallback(async () => {
    if (!selectedAssignee) {
      toast.error("Select a team member to assign", { position: "bottom-center" });
      return;
    }
    if (!hasTitle) {
      toast.error("Add a title before assigning", { position: "bottom-center" });
      return;
    }
    setAssigning(true);
    try {
      const payload: Record<string, any> = { assignedTo: selectedAssignee };
      const note = assignNote.trim();
      if (note) payload.note = note;
      const res = await fetch(`/api/posts/${initial.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to assign");
      }
      const assignedMember = teamMembers.find((m) => m.id === selectedAssignee);
      const displayName = assignedMember?.name || assignedMember?.email || assignedMember?.username || selectedAssignee;
      setCurrentAssigneeId(selectedAssignee);
      setCurrentAssigneeName(displayName);
      setAssignOpen(false);
      toast.success("Post assigned", { position: "bottom-center" });
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign", { position: "bottom-center" });
    } finally {
      setAssigning(false);
    }
  }, [assignNote, hasTitle, initial.id, router, selectedAssignee, teamMembers]);

  useEffect(() => {
    const handleSave = () => {
      void onSave();
    };
    const handlePublish = () => {
      void onPublish();
    };
    const handlePreview = () => setPreviewOpen(true);
    const handleDelete = () => {
      if (deleteAllowed) {
        void onDelete();
      }
    };
    const handleAssign = () => {
      if (!isAdmin) {
        toast.error("Only admins can assign posts.");
        return;
      }
      if (!hasTitle) {
        toast.error("Add a title before assigning.");
        return;
      }
      if (!teamLoaded) void loadTeam();
      setAssignOpen(true);
    };
    window.addEventListener("voidwrite:save", handleSave);
    window.addEventListener("voidwrite:publish", handlePublish);
    window.addEventListener("voidwrite:preview", handlePreview);
    window.addEventListener("voidwrite:delete", handleDelete);
    window.addEventListener("voidwrite:assign", handleAssign);
    return () => {
      window.removeEventListener("voidwrite:save", handleSave);
      window.removeEventListener("voidwrite:publish", handlePublish);
      window.removeEventListener("voidwrite:preview", handlePreview);
      window.removeEventListener("voidwrite:delete", handleDelete);
      window.removeEventListener("voidwrite:assign", handleAssign);
    };
  }, [deleteAllowed, hasTitle, isAdmin, loadTeam, onDelete, onPublish, onSave, teamLoaded]);

  const existingNoteList = notes.length > 0;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Edit Post</h1>
          <p className="mt-1 text-xs text-muted-foreground break-all">Slug: {slug || "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Assigned to: {currentAssigneeName || "Unassigned"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded border capitalize">Status: {status}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write a clear, short title…"
            aria-label="Post title"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="post-slug"
            aria-label="Post slug"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Excerpt</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the post"
            aria-label="Short description"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">SEO keywords</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
            placeholder="keyword one, keyword two"
            aria-label="SEO keywords"
          />
          <p className="mt-1 text-xs text-muted-foreground">Separate keywords with commas. Used in meta tags when the post is published.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Cover image</label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={clickUpload} className="px-3 py-1 border rounded text-sm">
              Upload cover image
            </button>
            <input ref={fileRef} onChange={onFile} type="file" accept="image/*" className="hidden" />
            {coverImageUrl && (
              <button type="button" onClick={removeCover} className="px-3 py-1 border rounded text-sm">
                Remove
              </button>
            )}
          </div>
          {coverImageUrl && (
            <div className="mt-2">
              <Image
                src={coverImageUrl}
                alt="Cover preview"
                width={800}
                height={450}
                className="max-h-48 w-auto rounded border object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Content</label>
          <RichEditor initialHTML={content || ""} onChange={setContent} />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Notes</h2>
        {existingNoteList ? (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded border px-3 py-2 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{note.authorName}</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{note.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
        {isAdmin && (
          <div>
            <label className="block text-sm mb-1">Add note</label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows={4}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Share feedback with the author"
            />
            <p className="mt-1 text-xs text-muted-foreground">Notes are saved when you click Save.</p>
          </div>
        )}
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-3 py-6 md:px-6 md:py-10">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-lg border bg-background shadow-2xl">
            <button aria-label="Close preview" onClick={() => setPreviewOpen(false)} className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-sm text-white">
              ✕
            </button>
            <div className="max-h-[80vh] overflow-y-auto">
              <article className="prose dark:prose-invert max-w-none px-5 py-6">
                {coverImageUrl && (
                  <div className="mb-4 overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImageUrl} alt="Cover" className="w-full object-cover" />
                  </div>
                )}
                <h1 className="mb-2 text-3xl font-semibold">{title || "Untitled post"}</h1>
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
            <button aria-label="Close assign" onClick={() => setAssignOpen(false)} className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-sm text-white">
              ✕
            </button>
            <div className="max-h-[80vh] overflow-y-auto space-y-4 p-5">
              <div>
                <h2 className="text-lg font-semibold">Assign Post</h2>
                <p className="text-sm text-muted-foreground">Select a team member and optionally add a note.</p>
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
                              isSelected ? "bg-accent/60" : ""
                            }`}
                          >
                            <span className="flex-1">
                              <span className="font-medium">{member.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {member.email || member.username || "No email"}
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">{member.role || ""}</span>
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
                  {assigning ? "Assigning…" : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function canDeletePermission(
  initial: any,
  status: string,
  currentAssigneeId: string | null,
  uid?: string,
  role?: string
) {
  if (!initial) return false;
  if (role === "admin") return true;
  const isAuthor = initial.authorId && initial.authorId === uid;
  const isAssignedToSomeone = currentAssigneeId != null;
  return Boolean(isAuthor && String(status) === "draft" && !isAssignedToSomeone);
}
