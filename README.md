Voidwrite — Admin‑First Blog CMS (Next.js + Drizzle + Auth.js)
=============================================================

Voidwrite is a modern, role‑aware blog CMS featuring a writer dashboard (Studio), editorial workflow (assign → submit → approve/publish), notifications, analytics, tags, and secure uploads.

Highlights
- Next.js 15 (App Router, TypeScript), Tailwind CSS v4
- Auth.js v5 (Credentials + Passkeys) with Drizzle Adapter
- Drizzle ORM + Postgres (Neon/Vercel Postgres)
- TipTap editor with image uploads (Vercel Blob)
- Role‑based access: Admin and Author (Editor)
- Editorial workflow: assign, submit, approve/publish
- Notifications: assignment, submission, approval
- Analytics: total + per‑day visitors, 7/30/90 chart
- Theme: cookie‑backed, system/dark/light

Quick Start
- Install deps: `pnpm install`
- Copy env: `.env.example` → `.env.local`, fill values
- Generate migration: `pnpm db:generate`
- Apply migration: `pnpm db:migrate`
- Dev server: `pnpm dev` → http://localhost:3000

Branding
- Edit `site.ts` to change the site title, description, tagline, and social links. Redeploy (or restart `pnpm dev`) to apply the changes.

Environment
- `DATABASE_URL=postgres://…`
- `AUTH_SECRET=<openssl rand -hex 32>`
- `NEXTAUTH_URL=http://localhost:3000` (local) or your Vercel URL
- `AUTH_WEBAUTHN_RP_NAME=Voidwrite`
- `AUTH_WEBAUTHN_RP_ID=localhost`
- `AUTH_WEBAUTHN_ORIGIN=http://localhost:3000`
- `BLOB_READ_WRITE_TOKEN=<vercel-blob-rw-token>`

Core Routes
- Public: `/`, `/posts/[slug]`, `/tag/[slug]`, `/rss.xml`, `/sitemap.xml`
- Auth: `/signup` (first signup becomes master admin), `/signin`
- Studio: `/studio` (dashboard), `/studio/posts` (All posts, admin‑only), `/studio/my-blogs` (My posts), `/studio/pending` (Submitted, admin‑only), `/studio/posts/new`, `/studio/posts/[id]`, `/studio/tags` (admin), `/studio/invite` (admin), `/studio/members` (admin), `/studio/settings`

Workflow Model
- Authors can draft and submit for review; cannot publish or delete assigned/published posts.
- Admins can assign, add notes, edit, publish, reassign, or delete any post.
- Notifications are created for assignments, submissions, and approvals.

Analytics
- Page views counted per post, with daily aggregation
- Dashboard shows total visitors, month/today counts, and a 7/30/90 chart

Tech Details
- DB schema: `db/schema.ts`; Auth tables: `db/auth-schema.ts`
- Migrations: `drizzle/` (via `pnpm db:generate` / `pnpm db:migrate`)
- Editor: `components/RichEditor.tsx`
- Post editor: `components/PostEditor.tsx`
- Role helpers: `lib/auth-helpers.ts`
- Analytics API: `app/api/analytics/views/route.ts`
- Uploads: `app/api/upload/route.ts`

Seeding
- Bootstrap an initial admin via `pnpm tsx scripts/seed.ts` (requires `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in env)

Deploy (Vercel)
- Provision Neon or Vercel Postgres; set `DATABASE_URL`
- Add required env vars
- `pnpm build` and run migrations at deploy

Author
- farouk chebaiki — https://github.com/faroukchebaiki
