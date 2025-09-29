/**
 * Central branding configuration
 * --------------------------------
 * Update the values in this file to rebrand the entire application.
 * UI copy, emails, metadata, and fallbacks all consume these settings.
 *
 * Tip: Keep brand-specific strings (names, taglines, addresses)
 * in the sections below so newcomers only need to edit this file.
 */

export type SiteConfig = {
  /** Primary product/brand identity */
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
  studio: {
    /** Name shown inside the editorial workspace */
    name: string;
    /** Label used on badges (sign-in / sign-up pages) */
    badgeLabel: string;
    /** Label used on public “join” prompts */
    inviteBadgeLabel: string;
    /** Short elevator pitch for the studio */
    mission: string;
  };
  contact: {
    /** Default inbox for contact form replies */
    email: string;
    /** Human readable sender name used in contact email headers */
    fromName: string;
    /** Mailbox used for outbound contact mail (fallback if env missing) */
    fromEmail: string;
    /** Reply-to mailbox for outbound mail */
    replyTo?: string;
  };
  legal: {
    entityName: string;
    termsTitle: string;
    termsDescription: string;
    privacyTitle: string;
    privacyDescription: string;
    copyrightHolder: string;
  };
  copy: {
    auth: {
      signInHeadline: string;
      signInDescription: string;
      signInFooter: string;
      signInLegal: string;
      signUpHeadline: string;
      signUpDescription: string;
      signUpHelper: string;
      signUpLegal: string;
    };
    marketing: {
      contactHeadline: string;
      contactDescription: string;
    };
    newsletter: {
      excerptFallback: string;
      quietWeek: string;
    };
    settings: {
      passwordHint: string;
    };
    footer: {
      blurb: string;
      legal: string;
    };
    misc: {
      contributorFallback: string;
    };
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
  project?: {
    repositoryUrl?: string;
    description?: string;
  };
};

// Basic brand constants to keep templated strings tidy.
const BRAND_NAME = 'Voidwrite';
const BRAND_TAGLINE = 'Fresh ideas, honest words.';
const BRAND_URL = 'https://voidwrite.com';
const STUDIO_NAME = `${BRAND_NAME} Studio`;

export const siteConfig: SiteConfig = {
  title: BRAND_NAME,
  description: 'A fast, modern blog built with Next.js, Drizzle ORM, and Auth.js.',
  tagline: BRAND_TAGLINE,
  url: BRAND_URL,
  locale: 'en-US',
  keywords: [
    BRAND_NAME,
    'Next.js blog',
    'Drizzle ORM',
    'JavaScript writing',
    'Creative publishing',
  ],
  author: {
    name: `${BRAND_NAME} Editorial`,
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
  studio: {
    name: STUDIO_NAME,
    badgeLabel: STUDIO_NAME,
    inviteBadgeLabel: `Join ${BRAND_NAME}`,
    mission: 'Protected workspace for contributors and editors.',
  },
  contact: {
    email: 'hello@voidwrite.com',
    fromName: BRAND_NAME,
    fromEmail: `${BRAND_NAME} <hello@voidwrite.local>`,
    replyTo: 'me@farouk.uk',
  },
  legal: {
    entityName: `${BRAND_NAME} Media`,
    termsTitle: 'Terms of Service',
    termsDescription: `The rules of the road for publishing, collaborating, and reading on ${BRAND_NAME}.`,
    privacyTitle: 'Privacy Policy',
    privacyDescription: `How ${BRAND_NAME} collects, uses, and stores data while you read or publish on the platform.`,
    copyrightHolder: BRAND_NAME,
  },
  copy: {
    auth: {
      signInHeadline: 'Welcome back to your editorial desk',
      signInDescription: 'Sign in to manage posts, assign stories, and keep the newsroom moving.',
      signInFooter: `Protected workspace for ${BRAND_NAME} contributors.`,
      signInLegal: `By continuing, you agree to the ${BRAND_NAME} Terms and acknowledge our Privacy Policy.`,
      signUpHeadline: 'Start publishing with the editorial collective',
      signUpDescription: `Create your ${BRAND_NAME} account to draft stories, collaborate with editors, and ship high-quality posts faster. Invite-only access keeps the newsroom secure.`,
      signUpHelper: 'We review all new members to keep entries curated.',
      signUpLegal: `By creating an account you agree to the ${BRAND_NAME} Terms and acknowledge our Privacy Policy.`,
    },
    marketing: {
      contactHeadline: `Say hello to the ${BRAND_NAME} team`,
      contactDescription: `Whether you have publishing questions, feedback about our stories, or you’d like to collaborate with ${BRAND_NAME}, drop us a note and we’ll get back to you as soon as we can.`,
    },
    newsletter: {
      excerptFallback: `Tap through to read the full story on ${BRAND_NAME}.`,
      quietWeek: 'Quiet week, but more stories are in the works.',
    },
    settings: {
      passwordHint: `Use a strong password unique to ${BRAND_NAME}. Minimum 8 characters with uppercase, lowercase, number, and special character.`,
    },
    footer: {
      blurb: `${BRAND_NAME} is an editorial studio built for fast-moving teams.`,
      legal: `© {year} ${BRAND_NAME}. All rights reserved.`,
    },
    misc: {
      contributorFallback: `${BRAND_NAME} Contributor`,
    },
  },
  feed: {
    title: `${BRAND_NAME} — Shipping stories from the studio`,
    description: `The latest essays, development logs, and releases from the ${BRAND_NAME} team.`,
    limit: 30,
  },
  staticRoutes: ['/', '/contact', '/privacy', '/terms', '/signin', '/signup', '/reset-password'],
  robots: {
    disallow: ['/studio', '/signin', '/signup', '/reset-password'],
  },
  newsletter: {
    fromEmail: `${BRAND_NAME} Weekly <newsletter@voidwrite.com>`,
    replyTo: 'me@farouk.uk',
    digestSubject: `This week on ${BRAND_NAME}`,
    postsPerDigest: 7,
  },
  project: {
    repositoryUrl: 'https://github.com/faroukchebaiki/voidwrite',
    description: 'Built with Next.js and a rotating cast of modern tools. The code is open source—fork it, remix it, or use it as a springboard for your own ideas.',
  },
};
