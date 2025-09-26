"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2Icon, PencilIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TrashRow = {
  id: number;
  title: string;
  slug: string;
  status: string;
  trashedAt: string | null;
  authorName?: string | null;
};

export default function TrashTableClient({ rows, total, limit, offset, search }: {
  rows: TrashRow[];
  total: number;
  limit: number;
  offset: number;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(search);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }),
    []
  );

  const updateParam = (key: string, value?: string, opts: { resetOffset?: boolean } = { resetOffset: true }) => {
    const qp = new URLSearchParams(params?.toString() ?? "");
    if (value === undefined || value === "") qp.delete(key); else qp.set(key, value);
    if (opts.resetOffset !== false) qp.delete("offset");
    const queryString = qp.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    startTransition(() => router.push(url));
  };

  const onSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParam("q", query.trim());
  };

  const onPageSize = (value: string) => updateParam("limit", value);
  const onPrev = () => updateParam("offset", String(Math.max(0, offset - limit)), { resetOffset: false });
  const onNext = () => updateParam("offset", String(offset + limit), { resetOffset: false });

  const onDelete = async (id: number) => {
    if (!confirm("Permanently delete this post? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/posts/${id}?hard=1`, { method: "DELETE" });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || "Failed to delete post");
      }
      toast.success("Post permanently deleted", { position: "bottom-center" });
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete post", { position: "bottom-center" });
    }
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const currentPage = total > 0 ? Math.floor(offset / limit) + 1 : 1;

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trashed posts"
          className="w-64"
        />
        <Button type="submit" disabled={pending}>
          Search
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Per page:</label>
          <Select value={String(limit)} onValueChange={onPageSize}>
            <SelectTrigger className="h-8 w-24">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Trashed</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  No trashed posts.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.title || "Untitled"}</div>
                    <div className="text-xs text-muted-foreground break-all">/{row.slug || ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{row.authorName || "Unknown"}</span>
                  </TableCell>
                  <TableCell>
                    {row.trashedAt ? (
                      <time dateTime={row.trashedAt} suppressHydrationWarning>
                        {dateFormatter.format(new Date(row.trashedAt))}
                      </time>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/studio/posts/${row.id}`} className="inline-flex items-center gap-2">
                          <PencilIcon className="size-4" /> Edit
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(row.id)}
                        className="inline-flex items-center gap-2"
                      >
                        <Trash2Icon className="size-4" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {total > 0
            ? `Showing ${Math.min(offset + 1, total)}-${Math.min(offset + rows.length, total)} of ${total}`
            : "No results"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateParam("offset", "0", { resetOffset: false })}
            disabled={pending || offset === 0}
          >
            First
          </Button>
          <Button variant="outline" size="sm" onClick={onPrev} disabled={pending || offset === 0}>
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={pending || offset + limit >= total}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const lastStart = Math.max(0, Math.floor((total - 1) / limit) * limit);
              updateParam("offset", String(lastStart), { resetOffset: false });
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
