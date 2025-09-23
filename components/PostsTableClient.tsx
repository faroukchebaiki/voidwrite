"use client";
import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  assignedToName?: string;
};

export default function PostsTableClient({ rows, total, limit, mine, sort, authorOptions = [], author, status, assigneeOptions = [], assignee, draftOnly }: {
  rows: PostRow[];
  total: number;
  limit: number;
  mine: boolean;
  sort: string;
  authorOptions?: { id: string; label: string }[];
  author?: string | null;
  status?: string;
  assigneeOptions?: { id: string; label: string }[];
  assignee?: string | null;
  draftOnly?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const offset = Math.max(0, Number(params.get('offset') || '0'));

  const updateParam = (key: string, value?: string, opts: { resetOffset?: boolean } = { resetOffset: true }) => {
    const qp = new URLSearchParams(params.toString());
    if (value === undefined || value === "") qp.delete(key); else qp.set(key, value);
    if (opts.resetOffset !== false) qp.delete('offset');
    // Keep navigation within the current list page (All vs My)
    const basePath = pathname.startsWith('/studio/my-blogs') ? '/studio/my-blogs' : '/studio/posts';
    const url = `${basePath}?${qp.toString()}`;
    startTransition(() => router.push(url));
  };

  const onSort = (v: string) => updateParam("sort", v);
  const onAuthor = (v: string) => updateParam("author", v === "all" ? "" : v);
  const onStatus = (v: string) => updateParam("status", v === 'all' ? "" : v);
  const onAssignee = (v: string) => updateParam("assignee", v === 'all' ? "" : v);
  const onToggleDraft = () => updateParam("draft", draftOnly ? "" : "1");
  const onPrev = () => updateParam('offset', String(Math.max(0, offset - limit)), { resetOffset: false });
  const onNext = () => updateParam('offset', String(offset + limit), { resetOffset: false });

  const onDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  const formatDate = useMemo(
    () => (value: string) => new Date(value).toLocaleString(),
    []
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!mine && authorOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Author:</label>
            <div>
              <AuthorSelect value={author ?? "all"} onValueChange={onAuthor} options={authorOptions} />
            </div>
          </div>
        )}
        {!mine && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <div>
              <StatusSelect value={status || 'all'} onValueChange={onStatus} />
            </div>
          </div>
        )}
        {!mine && assigneeOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Assignee:</label>
            <div>
              <AssigneeSelect value={assignee || 'all'} onValueChange={onAssignee} options={assigneeOptions} />
            </div>
          </div>
        )}
        {mine && (
          <Button variant={draftOnly ? "default" : "outline"} size="sm" onClick={onToggleDraft} aria-pressed={draftOnly}>
            {draftOnly ? "Showing Drafts" : "Drafts"}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Sort:</label>
          <div>
            <SortSelect value={sort} onValueChange={onSort} />
          </div>
          <label className="text-sm text-muted-foreground ml-3">Per page:</label>
          <div>
            <PageSizeSelect value={String(limit)} onValueChange={(v)=>updateParam('limit', v)} />
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
              <TableHead>Assignee</TableHead>
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
                <TableCell>
                  <Badge variant="outline" className="capitalize">{p.status}</Badge>
                </TableCell>
                {!mine && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={''} alt={p.authorName || ''} />
                        <AvatarFallback>{(p.authorName||'U').slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{p.authorName || ''}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  {p.assignedToName ? (
                    <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border">
                      <span className="h-4 w-4 rounded-full bg-muted inline-block" />
                      <span>{p.assignedToName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{p.visits}</TableCell>
                <TableCell>
                  <time dateTime={p.updatedAt} suppressHydrationWarning>
                    {formatDate(p.updatedAt)}
                  </time>
                </TableCell>
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
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {total > 0
            ? `Showing ${Math.min(offset + 1, total)}-${Math.min(offset + rows.length, total)} of ${total}`
            : 'No results'}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=>updateParam('offset','0',{resetOffset:false})} disabled={pending || offset === 0}>First</Button>
          <Button variant="outline" size="sm" onClick={onPrev} disabled={pending || offset === 0}>Prev</Button>
          <span className="text-xs text-muted-foreground">
            Page {total > 0 ? Math.floor(offset / limit) + 1 : 1} of {Math.max(1, Math.ceil(total / limit || 1))}
          </span>
          <Button variant="outline" size="sm" onClick={onNext} disabled={pending || offset + limit >= total}>Next</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={()=>{
              const lastStart = Math.max(0, Math.floor((total - 1) / limit) * limit);
              updateParam('offset', String(lastStart), { resetOffset: false });
            }}
            disabled={pending || offset + limit >= total}
          >
            Last
          </Button>
        </div>
      </div>
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

function PageSizeSelect({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-24">
        <SelectValue placeholder="Per page" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="15">15</SelectItem>
        <SelectItem value="30">30</SelectItem>
        <SelectItem value="50">50</SelectItem>
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

function StatusSelect({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-36">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="submitted">Submitted</SelectItem>
        <SelectItem value="published">Published</SelectItem>
      </SelectContent>
    </Select>
  );
}

function AssigneeSelect({ value, onValueChange, options }: { value: string; onValueChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-48">
        <SelectValue placeholder="All assignees" />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">All assignees</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
