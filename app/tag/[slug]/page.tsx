import { fetchPostsByTag, fetchAllTags } from '@/lib/sanity.queries';
import { Container, Typography, Stack } from '@mui/material';
import PostCard from '@/components/PostCard';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await fetchAllTags();
  return tags.map((t: any) => ({ slug: t.slug.current }));
}

export async function generateMetadata({ params }: any) {
  const posts = await fetchPostsByTag(params.slug);
  const title = `Tag: ${params.slug} (${posts.length})`;
  return { title };
}

export default async function TagPage({ params }: any) {
  const posts = await fetchPostsByTag(params.slug);
  if (!posts) notFound();
  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Tag: {params.slug}</Typography>
        <Stack spacing={2}>
          {posts.map((p: any) => (
            <PostCard key={p._id} post={p} />
          ))}
          {posts.length === 0 && (
            <Typography variant="body2" color="text.secondary">No posts for this tag.</Typography>
          )}
        </Stack>
      </Container>
    </main>
  );
}
