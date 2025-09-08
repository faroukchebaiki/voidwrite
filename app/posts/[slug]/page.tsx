import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fetchPostBySlug } from '@/lib/sanity.queries';
import { Container, Box, Typography, Divider } from '@mui/material';
import PostMeta from '@/components/PostMeta';
import PortableBody from '@/components/PortableBody';
import { urlFor } from '@/lib/sanity.image';
import ViewPing from './ViewPing';

export const revalidate = 60;

export async function generateMetadata({ params }: any) {
  const post = await fetchPostBySlug(params.slug);
  if (!post) return {};
  const description = post.excerpt || undefined;
  const images = post.coverImage ? [{ url: urlFor(post.coverImage).width(1200).height(630).fit('crop').url() }] : undefined;
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      images,
    },
  };
}

export default async function PostPage({ params }: any) {
  const post = await fetchPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>{post.title}</Typography>
        <PostMeta author={post.author} date={post.publishedAt} tags={post.tags} views={post.views} />
        {post.coverImage && (
          <Box sx={{ my: 2, position: 'relative', width: '100%', height: { xs: 220, sm: 360, md: 420 } }}>
            <Image
              src={urlFor(post.coverImage).width(1200).height(630).fit('crop').url()}
              alt={post.coverImage?.alt || post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
          </Box>
        )}
        <Divider sx={{ my: 3 }} />
        {post.body && <PortableBody value={post.body} />}
      </Container>
      <ViewPing slug={post.slug.current} />
    </main>
  );
}
