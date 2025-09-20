export type SiteConfig = {
  title: string;
  description: string;
  tagline: string;
  social: {
    facebook?: string;
    instagram?: string;
    pinterest?: string;
    youtube?: string;
    twitter?: string;
  };
};

export const siteConfig: SiteConfig = {
  title: 'Voidwrite',
  description: 'A fast, modern blog built with Next.js, Drizzle ORM, and Auth.js.',
  tagline: 'Fresh ideas, honest words.',
  social: {
    facebook: 'https://facebook.com/voidwrite',
    instagram: 'https://instagram.com/voidwrite',
    pinterest: 'https://pinterest.com/voidwrite',
    youtube: 'https://youtube.com/@voidwrite',
    twitter: 'https://twitter.com/voidwrite',
  },
};
