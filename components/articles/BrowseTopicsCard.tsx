import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BrowseTopicsCard({ tags }: { tags: { id: number; name: string | null; slug: string | null }[] }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Browse topics</CardTitle>
        <CardDescription>Explore our favorite themes and ongoing series.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((t) => (
            <Badge key={t.id} asChild variant="outline" className="px-3 py-1 text-sm">
              <Link href={`/tag/${t.slug}`}>#{t.name}</Link>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Tags are coming soon.</p>
        )}
      </CardContent>
    </Card>
  );
}
