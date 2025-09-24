# Voidwrite – Editorial CMS on Next.js 15

Voidwrite is a modern, opinionated blog platform tailored for editorial teams. It delivers a polished public site, a Studio dashboard for authors and admins, and a workflow that moves posts from draft to publication with analytics, tagging, and collaboration tooling. The current build targets the features listed below.

---

## Features at a Glance

- **Public experience**
  - Landing cards with author attribution, hover interactions, loading skeletons, and responsive layouts.
  - Article pages with hero cover, sidebar CTA cards (“Stay in the loop” + “Browse topics”), share bar (major networks + copy link), author spotlight, and softened reading surface.
  - Tag landing pages, RSS, sitemap, and view tracking per post.

- **Studio dashboard**
  - Overview metrics and visitors chart (up-to-date via daily view aggregation fallback).
  - Section-specific skeleton fallbacks so every Studio route loads gracefully.
  - Posts table with filters, draft toggle (only in “My Posts”), and author/assignee metadata.
  - Rich Post editor with dirty-state tracking (Save button highlight, Publish/Submit disabled until saved), hero cover picker, slug management (hidden on create unless editing as admin), tag and SEO helpers.
  - Settings screen with avatar upload, bio counter + 300 character limit, passkey management, and theme selection.
  - Admin utilities: assignments, notes, status changes, invite links, tag management, member overview.

- **Authentication & Roles**
  - Auth.js v5 with credentials + passkeys, Drizzle adapter, cookie-based theme preference.
  - Role-based access: admins can review/publish/delete; authors draft and submit.

- **Infrastructure**
  - Next.js App Router (15.x), TypeScript, Tailwind CSS v4.
  - Drizzle ORM targeting Postgres (Neon/Vercel Postgres friendly).
  - TipTap editor with Vercel Blob uploads.
  - Analytics API (`/api/views`, `/api/analytics/views`) stores both totals and daily counts.

---

## Getting Started

```bash
pnpm install
cp .env.example .env.local   # fill values
pnpm db:generate             # optional – sync schema to migrations
pnpm db:migrate              # apply migrations
pnpm dev                     # http://localhost:3000
```

**Essential env vars** (see `.env.example`):

- `DATABASE_URL` – Postgres connection
- `AUTH_SECRET` – `openssl rand -hex 32`
- `NEXTAUTH_URL` – App base URL
- `AUTH_WEBAUTHN_*` – RP metadata for passkeys
- `BLOB_READ_WRITE_TOKEN` – Vercel Blob RW token
- Optional analytics/deployment settings as needed

To seed an initial admin account: set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and run `pnpm tsx scripts/seed.ts`.

---

## Project Layout

```
app/
  page.tsx               # public homepage
  posts/[slug]/page.tsx   # article view + sidebar cards & share bar
  studio/*                # Studio dashboard + route-specific loading skeletons
  api/*                   # REST endpoints (posts, analytics, uploads, profile, etc.)
components/
  PostEditor.tsx          # main authoring experience
  PostsTableClient.tsx    # table used across Studio listings
  Header.tsx              # public header with sticky nav & icon labels
  articles/*              # shared sidebar cards for articles
  ui/*                    # shadcn-inspired primitives (button, card, etc.)
lib/                      # helpers (auth, utils, validation)
db/                       # Drizzle schema & config
```

Key files of interest:

- `components/PostEditor.tsx` – Save/publish flow, dirty tracking, assignments, tag selection.
- `components/site-header.tsx` – Studio header, action buttons, highlighted save state.
- `components/PostShareBar.tsx` – Share buttons + copy link feedback.
- `app/api/views/route.ts` – Page view tracking (cookie throttled, daily upsert).
- `app/api/analytics/views/route.ts` – Dashboard timeline with fallback for legacy totals.
- `components/SettingsSingle.tsx` – Profile settings (bio counter, passkeys, uploads).

---

## Workflow Overview

1. **Authoring** – Authors create posts (`/studio/posts/new`), save drafts, and submit once tags + content are complete. Slug is hidden during creation and auto-generated; admins can edit it later.
2. **Review** – Admins view `/studio/posts`, filter by status, assign reviewers, attach notes, and publish. Notifications fire for submissions, assignments, and approvals.
3. **Publishing** – Publishing updates totals, triggers notifications, and exposes the post publicly with share tracking.
4. **Analytics** – Each post view increments totals and daily counts, powering dashboard metrics (last 7/30/90 days).

---

## Scripts & Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run the local dev server |
| `pnpm build` | Production build (type check + lint) |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations |
| `pnpm tsx scripts/seed.ts` | Seed initial admin using env vars |

---

## Deployment Checklist

1. Provision Postgres (Neon/Vercel Postgres recommended); set `DATABASE_URL`.
2. Set all required env vars in your hosting platform (Vercel).
3. Run `pnpm db:migrate` during deploy (Vercel build step or migration hook).
4. Ensure Vercel Blob token is configured for uploads.
5. Optional: configure custom domain + `NEXTAUTH_URL`.

---

## Author

- **farouk chebaiki** – [github.com/faroukchebaiki](https://github.com/faroukchebaiki)

Contributions and issues are welcome. Feel free to fork Voidwrite or tailor it to your editorial workflow.
