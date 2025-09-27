export type SiteConfig = {
  title: string;
  description: string;
  tagline: string;
  url: string;
  locale: string;
  keywords: string[];
  author: {
    name: string;
    email?: string;
    url?: string;
    twitter?: string;
    github?: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    pinterest?: string;
    youtube?: string;
    twitter?: string;
  };
  branding: {
    ogImage: string;
    themeColorLight: string;
    themeColorDark: string;
  };
  feed: {
    title: string;
    description: string;
    limit: number;
  };
  staticRoutes: string[];
  robots: {
    disallow: string[];
  };
  newsletter: {
    fromEmail: string;
    replyTo?: string;
    digestSubject: string;
    postsPerDigest: number;
  };
};

export const siteConfig: SiteConfig = {
  title: 'Voidwrite',
  description: 'A fast, modern blog built with Next.js, Drizzle ORM, and Auth.js.',
  tagline: 'Fresh ideas, honest words.',
  url: 'https://voidwrite.com',
  locale: 'en-US',
  keywords: [
    'Voidwrite',
    'Next.js blog',
    'Drizzle ORM',
    'JavaScript writing',
    'Creative publishing',
  ],
  author: {
    name: 'Voidwrite Editorial',
    email: 'me@farouk.uk',
    url: 'https://github.com/faroukchebaiki',
    twitter: '@voidwrite',
    github: 'faroukchebaiki',
  },
  social: {
    facebook: 'https://facebook.com/voidwrite',
    instagram: 'https://instagram.com/voidwrite',
    pinterest: 'https://pinterest.com/voidwrite',
    youtube: 'https://youtube.com/@voidwrite',
    twitter: 'https://twitter.com/voidwrite',
  },
  branding: {
    ogImage: '/api/og',
    themeColorLight: '#ffffff',
    themeColorDark: '#0f0f0f',
  },
  feed: {
    title: 'Voidwrite — Shipping stories from the studio',
    description: 'The latest essays, development logs, and releases from the Voidwrite team.',
    limit: 30,
  },
  staticRoutes: ['/', '/contact', '/privacy', '/terms', '/signin', '/signup', '/reset-password'],
  robots: {
    disallow: ['/studio', '/signin', '/signup', '/reset-password'],
  },
  newsletter: {
    fromEmail: 'Voidwrite Weekly <newsletter@voidwrite.com>',
    replyTo: 'me@farouk.uk',
    digestSubject: 'This week on Voidwrite',
    postsPerDigest: 7,
  },
};
