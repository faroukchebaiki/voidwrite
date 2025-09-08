Voidwrite — Next.js + Sanity + MUI Blog
=================================================

Production-ready blog built with Next.js (App Router, TS), Sanity (CMS), MUI with a persistent light/dark toggle, and Vercel Analytics. Includes ISR, view counter, RSS, sitemap, and a Studio at `/studio`.

Quick Start
- Install: `pnpm install`
- Dev: `pnpm dev` → http://localhost:3000
- Studio: http://localhost:3000/studio (optionally protected by basic auth)

Environment Variables
Add these in `.env.local` (and in Vercel Project Settings). See Vercel/Sanity.io integration docs for variable meanings and setup details.

Public (client-safe)
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`

Server-only
- `SANITY_API_PROJECT_ID`
- `SANITY_API_DATASET`
- `SANITY_STUDIO_PROJECT_ID` (optional; defaults to public vars)
- `SANITY_STUDIO_DATASET` (optional; defaults to public vars)
- `SANITY_API_READ_TOKEN` (optional; for server queries)
- `SANITY_API_WRITE_TOKEN` (required to store view counts in Sanity)
- `STUDIO_BASIC_AUTH_USER` and `STUDIO_BASIC_AUTH_PASS` (optional; protects `/studio`)

Tech Stack
- Next.js App Router + TypeScript, pnpm
- Sanity (`@sanity/client`, `next-sanity`, `groq`)
- MUI (`@mui/material`, `@emotion/*`) + `next-themes`
- `@portabletext/react`, `@sanity/image-url`
- `dayjs`, `zod`, `@vercel/analytics`

Features
- Home: latest posts, “Top posts”, tag list
- Post: title, meta (author/date/tags), cover image, rich body (Portable Text), view badge
- Tag pages: list posts by tag
- Sanity Studio at `/studio` with Post/Tag/Author/Settings
- Dark/Light mode toggle (persistent, system default)
- Responsive Sanity images via `next/image`
- View counter API (`/api/views/[slug]`) storing counts in Sanity
- RSS feed (`/rss.xml`) and sitemap (`/sitemap.xml`)

Sanity Studio
- Configure project and dataset in env vars
- Schemas at `sanity/schemas/*`
- Studio config at `sanity/sanity.config.ts`
- Studio mounted at `app/studio/[[...index]]/page.tsx` (noindex; optional basic auth)

Development Notes
- Queries live in `lib/sanity.queries.ts` (GROQ)
- Sanity client in `lib/sanity.client.ts`
- MUI theme + next-themes in `lib/theme.ts` and `components/ThemeRegistry.tsx`
- Env loader with zod at `lib/env.ts`
- ISR: Pages export `revalidate = 60`

Deploy on Vercel
- Framework: Next.js, Build: `pnpm build`
- Add the env vars above
- Enable Vercel Web Analytics
- Optional: set up a Sanity webhook to invoke Next revalidate on publish
