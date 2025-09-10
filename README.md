Voidwrite — Next.js Blog CMS (Drizzle + Auth.js)
=================================================

Database-backed blog CMS with Next.js (App Router), Tailwind, Drizzle ORM, and Auth.js (Credentials + Passkeys). Includes admin dashboard, role-based access, RSS, and deploys to Vercel Hobby with Vercel Postgres (Neon).

Quick Start
- Install: `pnpm install`
- Configure: copy `.env.example` → `.env.local` and fill values
- Generate SQL: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Seed (optional admin): `SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=strongpass pnpm seed`
- Dev: `pnpm dev` → http://localhost:3000

Environment Variables
Create `.env.local` (Vercel: Project Settings → Environment Variables)

- `DATABASE_URL=postgres://<...>`
- `AUTH_SECRET=<openssl rand -hex 32>`
- `NEXTAUTH_URL=https://<your-vercel-url>` (use http://localhost:3000 locally)
- `AUTH_WEBAUTHN_RP_NAME=My Blog`
- `AUTH_WEBAUTHN_RP_ID=my-domain.com` (use `localhost` locally)
- `AUTH_WEBAUTHN_ORIGIN=https://my-domain.com` (use `http://localhost:3000` locally)

Stack
- Next.js (App Router, TS), TailwindCSS
- Vercel Postgres (Neon) + `drizzle-orm`, `drizzle-kit`, `pg`
- Auth.js v5 (beta) + Drizzle Adapter, providers: Credentials + Passkey
- `argon2` for password hashing, `zod` for validation
- Markdown via `markdown-it` + `sanitize-html`

Features
- Public: `/` (published posts), `/posts/[slug]`, `/tags/[tag]`, `/rss.xml`
- Auth: `/signup`, `/signin`, `/account` (manage password + passkeys)
- Admin: `/admin`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]`, `/admin/settings`
- Role-based access with middleware protecting `/admin/*` (admin/editor)

Database & Migrations
- Schema in `db/schema.ts` (CMS) and `db/auth-schema.ts` (Auth.js tables)
- Config in `drizzle.config.ts`, SQL in `drizzle/`
- Commands: `pnpm db:generate`, `pnpm db:migrate`

Seed
- `SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=... pnpm seed`
- Creates default settings and an admin user with hashed password

Deploy on Vercel
- Add Vercel Postgres (Neon) and set `DATABASE_URL`
- Add Auth env vars above
- Build: `pnpm build` (default Next.js)
- Run `pnpm db:migrate` via Vercel deployment script or locally

License
- MIT (see `LICENSE`)
