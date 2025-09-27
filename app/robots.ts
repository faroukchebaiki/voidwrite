import type { MetadataRoute } from 'next';
import { siteConfig } from '@/site';

const rawSiteUrl = siteConfig.url?.trim();
const siteUrl = rawSiteUrl ? rawSiteUrl.replace(/\/$/, '') : undefined;

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteUrl,
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: siteConfig.robots.disallow,
      },
    ],
  };
}
