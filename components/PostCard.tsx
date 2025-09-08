import Link from 'next/link';
import Image from 'next/image';
import { Card, CardActionArea, CardContent, CardMedia, Typography, Stack } from '@mui/material';
import type { Post } from '@/lib/sanity.queries';
import { urlFor } from '@/lib/sanity.image';
import PostMeta from './PostMeta';

export default function PostCard({ post }: { post: Post }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea component={Link} href={`/posts/${post.slug.current}`} sx={{ height: '100%', alignItems: 'stretch' }}>
        {post.coverImage && (
          <CardMedia sx={{ position: 'relative', height: 180 }}>
            <Image
              src={urlFor(post.coverImage).width(800).height(450).fit('crop').url()}
              alt={post.coverImage?.alt || post.title}
              fill
              sizes="(max-width: 600px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </CardMedia>
        )}
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">{post.title}</Typography>
            {post.excerpt && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {post.excerpt}
              </Typography>
            )}
            <PostMeta author={post.author} date={post.publishedAt} tags={post.tags} views={post.views} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
