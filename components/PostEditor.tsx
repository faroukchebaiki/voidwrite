"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IMAGE_UPLOAD_MAX_BYTES } from "@/lib/uploads";

import RichEditor from "@/components/RichEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  authorImage?: string | null;
};

type TagOption = { slug: string; name: string };

type PostEditorProps = {
  initial?: any;
  role?: string;
  uid?: string;
  comments?: PostNote[];
  tags: TagOption[];
  mode: "create" | "edit";
  initialTags?: string[];
};

export default function PostEditor({ initial = {}, role, uid, comments: initialComments = [], tags, mode, initialTags = [] }: PostEditorProps) {
  const router = useRouter();
  const isAdmin = role === "admin";

  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [excerpt, setExcerpt] = useState(initial.excerpt || "");
  const [seoKeywords, setSeoKeywords] = useState(initial.seoKeywords || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl || "");
  const [content, setContent] = useState(initial.content || "");
  const [status, setStatus] = useState<string>(String(initial.status || "draft"));
  const [comments, setComments] = useState<PostNote[]>(initialComments || []);
  const [visibleCount, setVisibleCount] = useState(Math.min(10, initialComments.length || 10));
  useEffect(() => {
    const next = initialComments || [];
    setComments(next);
    setVisibleCount(Math.min(10, next.length || 10));
  }, [initialComments]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);

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
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [tagSearch, setTagSearch] = useState("");
  const [postId, setPostId] = useState<number | null>(initial.id ?? null);
  const [dirty, setDirty] = useState(false);
  const heading = mode === 'create' ? 'Create Post' : 'Edit Post';

  const fileRef = useRef<HTMLInputElement>(null);

  const hasTitle = useMemo(() => title.trim().length > 0, [title]);
  const hasContent = useMemo(
    () => (content || "").replace(/<[^>]*>/g, "").trim().length > 0,
    [content]
  );
  const filteredTagOptions = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q));
  }, [tagSearch, tags]);
  const toggleTag = useCallback((slugValue: string) => {
    setSelectedTags((prev) => (prev.includes(slugValue) ? prev.filter((item) => item !== slugValue) : [...prev, slugValue]));
  }, []);
  useEffect(() => {
    setSelectedTags(initialTags);
  }, [initialTags]);

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

  const authorId = initial.authorId as string | undefined;
  const assignedToId = initial.assignedTo as string | undefined;

  const canViewComments = useMemo(() => {
    if (isAdmin) return true;
    if (!uid) return false;
    return (!!authorId && authorId === uid) || (!!assignedToId && assignedToId === uid);
  }, [assignedToId, authorId, isAdmin, uid]);

  const canPostComments = useMemo(() => canViewComments && Boolean(postId), [canViewComments, postId]);

  const onSubmitComment = useCallback(async () => {
    if (!canViewComments) {
      toast.error('You do not have access to comment on this post.', { position: 'bottom-center' });
      return;
    }
    if (!postId) {
      toast.error('Save the post before adding comments.', { position: 'bottom-center' });
      return;
    }
    const trimmed = commentDraft.trim();
    if (!trimmed) {
      toast.error('Write a comment before posting.', { position: 'bottom-center' });
      return;
    }
    if (postingComment) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/posts/${postId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: trimmed }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => 'Failed to post comment');
        throw new Error(message || 'Failed to post comment');
      }
      const created = await res.json();
      setComments((prev) => {
        const next = [created, ...prev];
        setVisibleCount((count) => Math.min(next.length, Math.max(count + 1, 10)));
        return next;
      });
      setCommentDraft('');
      toast.success('Comment posted', { position: 'bottom-center' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post comment', { position: 'bottom-center' });
    } finally {
      setPostingComment(false);
    }
  }, [canViewComments, commentDraft, postId, postingComment]);

  const emitActionState = useCallback(
    (canSave: boolean, canPublish: boolean, canAssign: boolean, publishLabel: string, highlightSave: boolean) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("voidwrite:actions-state", {
            detail: { canSave, canPublish, canDelete: deleteAllowed, canAssign, publishLabel, highlightSave },
          })
        );
      }
    },
    [deleteAllowed]
  );

  const readyForSubmit = hasTitle && hasContent && selectedTags.length > 0;

  const snapshotRef = useRef<{ title: string; slug: string; excerpt: string; content: string; coverImageUrl: string; seoKeywords: string; tags: string } | null>(null);

  useEffect(() => {
    snapshotRef.current = {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      seoKeywords,
      tags: selectedTags.join('|'),
    };
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      seoKeywords,
      tags: selectedTags.join('|'),
    };
    const last = snapshotRef.current;
    if (!last) {
      snapshotRef.current = current;
      setDirty(false);
      return;
    }
    const changed =
      current.title !== last.title ||
      current.slug !== last.slug ||
      current.excerpt !== last.excerpt ||
      current.content !== last.content ||
      current.coverImageUrl !== last.coverImageUrl ||
      current.seoKeywords !== last.seoKeywords ||
      current.tags !== last.tags;
    if (changed !== dirty) {
      setDirty(changed);
    }
  }, [content, coverImageUrl, dirty, excerpt, seoKeywords, selectedTags, slug, title]);

  const markSavedSnapshot = useCallback(() => {
    snapshotRef.current = {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      seoKeywords,
      tags: selectedTags.join('|'),
    };
    setDirty(false);
  }, [content, coverImageUrl, excerpt, selectedTags, seoKeywords, slug, title]);

  useEffect(() => {
    return () => {
      emitActionState(false, false, false, isAdmin ? "Publish" : "Submit", false);
    };
  }, [emitActionState, isAdmin]);

  useEffect(() => {
    emitActionState(true, !dirty && readyForSubmit, isAdmin && hasTitle, isAdmin ? "Publish" : "Submit", dirty);
  }, [dirty, emitActionState, isAdmin, hasTitle, readyForSubmit, deleteAllowed]);

  useEffect(() => {
    const onRequest = () => {
      emitActionState(true, !dirty && readyForSubmit, isAdmin && hasTitle, isAdmin ? "Publish" : "Submit", dirty);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('voidwrite:request-actions-state', onRequest);
      return () => window.removeEventListener('voidwrite:request-actions-state', onRequest);
    }
  }, [dirty, emitActionState, hasTitle, isAdmin, readyForSubmit]);

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
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      toast.error('Images must be under 3MB. Try uploading a smaller file.');
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const best = data?.variants?.['1600w'] || data?.url;
      if (!best) throw new Error('Upload failed');
      setCoverImageUrl(best);
      toast.success("Cover uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeCover = () => setCoverImageUrl("");

  const onSave = useCallback(async (): Promise<number | null> => {
    if (saving) return postId ?? null;
    setSaving(true);
    try {
      const baseSlug = slug.trim() || (title ? slugify(title) : '').trim();
      const nextSlug = baseSlug || `draft-${Date.now().toString(36)}`;

      if (!postId) {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug: nextSlug,
            excerpt,
            content,
            status: 'draft',
            coverImageUrl,
            seoKeywords: seoKeywords.trim() ? seoKeywords.trim() : null,
            tags: selectedTags,
          }),
        });
        if (!res.ok) {
          const message = await res.text().catch(() => 'Failed to save');
          throw new Error(message || 'Failed to save');
        }
        const created = await res.json();
        setPostId(created.id);
        setSlug(created.slug || nextSlug);
        toast.success('Draft saved. Continue editing or submit when ready.', { position: 'bottom-center', duration: 4000 });
        markSavedSnapshot();
        router.replace(`/studio/posts/${created.id}`);
        return created.id as number;
      }

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: nextSlug,
          excerpt,
          content,
          coverImageUrl,
          seoKeywords: seoKeywords.trim() ? seoKeywords.trim() : null,
          tags: selectedTags,
        }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => 'Failed to save');
        throw new Error(message || 'Failed to save');
      }
      setSlug(nextSlug);
      toast.success('Post saved', { position: 'bottom-center' });
      markSavedSnapshot();
      router.refresh();
      return postId;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save', { position: 'bottom-center' });
      return null;
    } finally {
      setSaving(false);
    }
  }, [coverImageUrl, content, excerpt, markSavedSnapshot, postId, router, saving, selectedTags, slug, slugify, title, seoKeywords]);

  const validateForSubmission = useCallback(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push('title');
    if (!hasContent) missing.push('content');
    if (selectedTags.length === 0) missing.push('tag');
    if (missing.length) {
      toast.error('Add a title, content, and at least one tag before submitting or publishing.', {
        position: 'bottom-center',
      });
      return false;
    }
    return true;
  }, [hasContent, selectedTags, title]);

  const onPublish = useCallback(async () => {
    if (publishing) return;
    if (!validateForSubmission()) return;
    setPublishing(true);
    try {
      let id = postId;
      if (dirty || !id) {
        id = await onSave();
      }
      if (!id) {
        return;
      }

      if (!isAdmin) {
        const res = await fetch(`/api/posts/${id}/submit`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to submit');
        toast.success('Post submitted for review.', { position: 'bottom-center' });
        setStatus('submitted');
        router.refresh();
        return;
      }

      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to publish');
      toast.success('Post published', { position: 'bottom-center' });
      setStatus('published');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || (isAdmin ? 'Failed to publish' : 'Failed to submit'), { position: 'bottom-center' });
    } finally {
      setPublishing(false);
    }
  }, [dirty, isAdmin, onSave, postId, publishing, router, validateForSubmission]);

  const onDelete = useCallback(async () => {
    if (!deleteAllowed || !postId) return;
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Post deleted", { position: "bottom-center" });
      location.href = "/studio/posts";
    } else {
      toast.error("Failed to delete", { position: "bottom-center" });
    }
  }, [deleteAllowed, postId]);

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
      let id = postId;
      if (dirty || !id) {
        id = await onSave();
      }
      if (!id) {
        throw new Error('Save the draft before assigning.');
      }
      const payload: Record<string, any> = { assignedTo: selectedAssignee };
      const note = assignNote.trim();
      if (note) payload.note = note;
      const res = await fetch(`/api/posts/${id}/assign`, {
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
  }, [assignNote, dirty, hasTitle, onSave, postId, router, selectedAssignee, teamMembers]);

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

  const hasComments = comments.length > 0;
  const visibleComments = hasComments ? comments.slice(0, visibleCount) : [];
  const canLoadMoreComments = visibleCount < comments.length;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{heading}</h1>
          {(slug || isAdmin) && (
            <p className="mt-1 text-xs text-muted-foreground break-all">Slug: {slug || "—"}</p>
          )}
          {postId && (
            <p className="mt-1 text-xs text-muted-foreground">
              Assigned to: {currentAssigneeName || "Unassigned"}
            </p>
          )}
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
        {isAdmin && mode === 'edit' && (
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
        )}
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
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="block text-sm font-medium">Tags</label>
              <p className="text-xs text-muted-foreground">Select at least one tag for this post.</p>
            </div>
            <input
              className="w-full rounded border px-3 py-2 text-sm sm:w-56"
              placeholder="Search tags"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.length > 0 ? (
              selectedTags.map((slugValue) => {
                const tag = tags.find((t) => t.slug === slugValue);
                return (
                  <button
                    key={slugValue}
                    type="button"
                    onClick={() => toggleTag(slugValue)}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    {tag?.name || slugValue}
                    <span aria-hidden>×</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-muted-foreground">No tags selected yet.</span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto rounded border bg-muted/5 p-2">
            {filteredTagOptions.length === 0 && <div className="text-xs text-muted-foreground">No tags match your search.</div>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredTagOptions.map((tag) => {
                const active = selectedTags.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => toggleTag(tag.slug)}
                    className={`rounded border px-3 py-1 text-sm transition ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
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

      {canViewComments && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Comments</h2>
          {postId ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Add a comment</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={3}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={isAdmin ? 'Share feedback with the team' : 'Leave a note for the editors'}
                  disabled={!canPostComments}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-1.5 text-sm"
                    onClick={onSubmitComment}
                    disabled={!canPostComments || postingComment || !commentDraft.trim()}
                  >
                    {postingComment ? 'Posting…' : 'Post comment'}
                  </button>
                </div>
                {!canPostComments && (
                  <p className="text-xs text-muted-foreground">Save the post before adding comments.</p>
                )}
              </div>
              {hasComments ? (
                <div className="space-y-3">
                  <ul className="space-y-3">
                    {visibleComments.map((comment) => {
                      const formattedDate = new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(comment.createdAt));

                      return (
                        <li key={comment.id} className="rounded border p-3 text-sm shadow-sm">
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.authorImage || undefined} alt={comment.authorName} />
                              <AvatarFallback>
                                {comment.authorName
                                  .split(/\s+/)
                                  .map((part) => part[0]?.toUpperCase())
                                  .join('')
                                  .slice(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{comment.authorName}</span>
                                <span>{formattedDate}</span>
                              </div>
                              <p className="whitespace-pre-wrap leading-snug text-sm text-foreground">{comment.note}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {canLoadMoreComments && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="rounded border px-3 py-1.5 text-sm"
                        onClick={() => setVisibleCount((count) => Math.min(count + 10, comments.length))}
                      >
                        Load more comments
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </div>
          ) : (
            <div className="rounded border px-3 py-2 text-sm text-muted-foreground">
              Save the draft first to start the conversation.
            </div>
          )}
        </section>
      )}

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
