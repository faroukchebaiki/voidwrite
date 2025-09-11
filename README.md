Voidwrite — Next.js Blog CMS (Drizzle + Auth.js)
=================================================

Modern, database-backed blog CMS built with Next.js (App Router), Tailwind CSS, Drizzle ORM, and Auth.js v5 (Credentials + Passkeys). Includes a writer dashboard (Studio), role-based access, RSS, image uploads via Vercel Blob, and deploys easily to Vercel + Neon.

Quick Start
- Install: `pnpm install`
- Configure env: copy `.env.example` → `.env.local` and fill values
- Generate SQL: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Seed optional admin: `SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=strongpass pnpm seed`
- Dev: `pnpm dev` → http://localhost:3000

Environment Variables
Create `.env.local` (Vercel → Project Settings → Environment Variables). Use `.env.example` as a template.

- `DATABASE_URL=postgres://<...>`
- `AUTH_SECRET=<openssl rand -hex 32>`
- `NEXTAUTH_URL=https://<your-vercel-url>` (use `http://localhost:3000` locally)
- `AUTH_WEBAUTHN_RP_NAME=My Blog`
- `AUTH_WEBAUTHN_RP_ID=my-domain.com` (use `localhost` locally)
- `AUTH_WEBAUTHN_ORIGIN=https://my-domain.com` (use `http://localhost:3000` locally)
- `BLOB_READ_WRITE_TOKEN=<vercel-blob-rw-token>`

Stack
- Next.js 15 (App Router, TypeScript), Tailwind CSS
- Drizzle ORM + `drizzle-kit` + Postgres (`pg`) on Neon/Vercel Postgres
- Auth.js v5 + Drizzle Adapter, providers: Credentials + Passkey (WebAuthn)
- Password hashing via `argon2` (fallback to `@node-rs/argon2`)
- Markdown via `markdown-it` + `sanitize-html`
- Rich editor (TipTap) for writing posts
- File uploads via Vercel Blob

Features
- Public: `/` (published posts), `/posts/[slug]`, `/tag/[slug]`, `/rss.xml`, `/sitemap.xml`
- Auth: `/signup`, `/signin` (redirects to Studio if already signed in)
- Studio only: `/studio`, `/studio/posts`, `/studio/posts/new`, `/studio/posts/[id]`, `/studio/settings`
- Role-based access (admin/editor) protected by middleware

Folder Tree
```
app/
  account/                     Account management (passkeys, password)
  api/                         API routes (Auth, posts, tags, settings, upload)
  posts/[slug]/page.tsx        Public post page (Markdown rendered)
  rss.xml/route.ts             RSS feed
  sitemap.xml/route.ts         Sitemap
  signin/, signup/             Auth pages
  studio/                      Writer dashboard (Studio)
    layout.tsx                 Studio shell + nav
    page.tsx                   Overview (stats)
    posts/, settings/          Studio sections
  layout.tsx                   Root layout (theme, header/footer)
components/
  Header.tsx, Footer.tsx       Public site header/footer
  RichEditor.tsx               TipTap-based editor for content
  PostEditor.tsx               Post editor used by Studio edit page
  SettingsForm.tsx             Settings form used by Studio
  SignOutButton.tsx            Client sign-out button
db/
  schema.ts                    CMS tables (posts, tags, settings, profiles)
  auth-schema.ts               Auth.js tables for Drizzle adapter
  index.ts                     Drizzle + PG pool
drizzle/                       Generated SQL artifacts
lib/
  env.ts                       Server env validation (zod)
  markdown.ts                  Markdown → sanitized HTML
  password.ts                  Argon2 hash/verify helpers
  validation.ts                zod schemas for API inputs
scripts/
  seed.ts                      Seed settings and optional admin user
styles/
  editor.css, theme.css        Styling
```

Database & Migrations
- Schema in `db/schema.ts` (CMS) and `db/auth-schema.ts` (Auth.js)
- Config in `drizzle.config.ts`, SQL in `drizzle/`
- Commands: `pnpm db:generate`, `pnpm db:migrate`

Seeding
- `SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=... pnpm seed`
- Creates default settings and an admin user with a hashed password

Deployment (Vercel)
- Add Neon (Vercel Postgres) and set `DATABASE_URL`
- Add env vars above (Auth + Blob)
- Build with `pnpm build`
- Run migrations during deploy (e.g., via deploy script or manually)

License
- MIT (see `LICENSE`)
