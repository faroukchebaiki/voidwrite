"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreVerticalIcon, Trash2Icon, PencilIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type PostRow = {
  id: number;
  title: string;
  slug: string;
  status: string;
  visits: number;
  updatedAt: string;
  authorId?: string;
  authorName?: string;
};

export default function PostsTableClient({ rows, total, limit, mine, draftOnly, sort, authorOptions = [], author }: {
  rows: PostRow[];
  total: number;
  limit: number;
  mine: boolean;
  draftOnly: boolean;
  sort: string;
  authorOptions?: { id: string; label: string }[];
  author?: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const nextLimit = Math.min(limit + 15, total);

  const updateParam = (key: string, value?: string) => {
    const qp = new URLSearchParams(params.toString());
    if (value === undefined || value === "") qp.delete(key); else qp.set(key, value);
    const url = `/studio/posts?${qp.toString()}`;
    startTransition(() => router.push(url));
  };

  const onToggleDraft = () => updateParam("draft", draftOnly ? "" : "1");
  const onSort = (v: string) => updateParam("sort", v);
  const onAuthor = (v: string) => updateParam("author", v === "all" ? "" : v);
  const onShowMore = () => updateParam("limit", String(nextLimit));

  const onDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={draftOnly ? "default" : "outline"} size="sm" onClick={onToggleDraft} aria-pressed={draftOnly}>
          {draftOnly ? "Showing Drafts" : "Drafts filter"}
        </Button>
        {!mine && authorOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Author:</label>
            <div>
              <AuthorSelect value={author ?? "all"} onValueChange={onAuthor} options={authorOptions} />
            </div>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Sort:</label>
          <div>
            <SortSelect value={sort} onValueChange={onSort} />
          </div>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              {!mine && <TableHead>Author</TableHead>}
              <TableHead className="text-right">Visits</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/studio/posts/${p.id}`} className="underline-offset-2 hover:underline">{p.title}</Link>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </TableCell>
                <TableCell className="capitalize">{p.status}</TableCell>
                {!mine && <TableCell>{p.authorName || ""}</TableCell>}
                <TableCell className="text-right tabular-nums">{p.visits}</TableCell>
                <TableCell>{new Date(p.updatedAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                        <MoreVerticalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem asChild>
                        <Link href={`/studio/posts/${p.id}`} className="flex items-center gap-2">
                          <PencilIcon className="size-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(p.id)}>
                        <Trash2Icon className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={onShowMore} disabled={pending}>Show more</Button>
        </div>
      )}
    </div>
  );
}

function SortSelect({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-44">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="updated">Recently updated</SelectItem>
        <SelectItem value="visits">Most visits</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AuthorSelect({ value, onValueChange, options }: { value: string; onValueChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-48">
        <SelectValue placeholder="All authors" />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">All authors</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
