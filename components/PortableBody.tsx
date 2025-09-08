import Image from 'next/image';
import { PortableText, PortableTextComponents } from '@portabletext/react';
import { Typography, List, ListItem } from '@mui/material';
import { urlFor } from '@/lib/sanity.image';

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const alt = value?.alt || 'Image';
      const src = urlFor(value).width(1200).fit('max').url();
      const width = 1200;
      const height = Math.round((value?.asset?.metadata?.dimensions?.height || 800) * (1200 / (value?.asset?.metadata?.dimensions?.width || 1200)));
      return (
        <Image src={src} alt={alt} width={width} height={height} style={{ width: '100%', height: 'auto' }} />
      );
    },
    code: ({ value }) => (
      <pre style={{ background: 'rgba(128,128,128,0.1)', padding: '1rem', borderRadius: 6, overflow: 'auto' }}>
        <code>{value.code}</code>
      </pre>
    ),
  },
  block: {
    h1: ({ children }) => <Typography variant="h3" gutterBottom>{children}</Typography>,
    h2: ({ children }) => <Typography variant="h4" gutterBottom>{children}</Typography>,
    h3: ({ children }) => <Typography variant="h5" gutterBottom>{children}</Typography>,
    h4: ({ children }) => <Typography variant="h6" gutterBottom>{children}</Typography>,
    normal: ({ children }) => <Typography paragraph>{children}</Typography>,
    blockquote: ({ children }) => (
      <Typography component="blockquote" sx={{ borderLeft: 3, borderColor: 'divider', pl: 2, fontStyle: 'italic' }}>{children}</Typography>
    ),
  },
  list: {
    bullet: ({ children }) => <List sx={{ listStyle: 'disc', pl: 4 }}>{children}</List>,
    number: ({ children }) => <List sx={{ listStyle: 'decimal', pl: 4 }}>{children}</List>,
  },
  listItem: {
    bullet: ({ children }) => <ListItem sx={{ display: 'list-item', p: 0 }}>{children}</ListItem>,
    number: ({ children }) => <ListItem sx={{ display: 'list-item', p: 0 }}>{children}</ListItem>,
  },
};

export default function PortableBody({ value }: { value: any[] }) {
  return <PortableText value={value} components={components} />;
}

