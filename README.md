# Voidwrite — An Editorial Studio on Next.js 15

> Live production example: **https://voidwrite.farouk.uk/**  
> Need help or have questions? **me@farouk.uk**

Voidwrite is a full-featured publishing platform built for small editorial teams who want a fast public blog and a collaborative authoring studio under one roof. It is opinionated, pragmatic, and ships with everything you need to run a modern publication: a polished reader experience, a role-aware studio, post analytics, passkey-ready authentication, and flexible branding that is controlled from a single config file.

This repository contains the exact source used to run the public demo linked above. The rest of this document explains how the project was assembled, how each subsystem works, and how you can adapt it to launch your own newsroom with minimal effort.

---

## Table of Contents

1. [Why Voidwrite?](#why-voidwrite)
2. [Project Architecture](#project-architecture)
3. [Branding & Customisation (`site.ts`)](#branding--customisation-sitets)
4. [Screenshots & Feature Highlights](#screenshots--feature-highlights)
5. [Environment Variables](#environment-variables)
6. [Getting Started Locally](#getting-started-locally)
7. [Database & Drizzle ORM](#database--drizzle-orm)
8. [Authentication & Passkeys](#authentication--passkeys)
9. [File Uploads & Media Handling](#file-uploads--media-handling)
10. [Email & Newsletter Digest](#email--newsletter-digest)
11. [Analytics & Post Views](#analytics--post-views)
12. [Deployment Checklist](#deployment-checklist)
13. [Contributing & Support](#contributing--support)

---

## Why Voidwrite?

I built Voidwrite out of a recurring need: small teams want the polish of a custom publication without inheriting the maintenance burden of a full CMS. They need:

- a **reader-first** site with refined typography, share surfaces, and responsive cards;
- an **editorial studio** with role-aware workflows (authors vs. editors) and easy collaboration;
- a **secure authentication** layer that embraces modern credentials (passkeys) alongside classic email/password;
- a **developer-friendly stack** based on TypeScript, Next.js App Router, and Drizzle ORM; and
- a **single source of truth** for branding so new adopters can re-theme the platform in minutes.

Voidwrite aims to be that foundation. The project is intentionally opinionated but fully customisable—the goal is to modify `site.ts`, fill in the `.env.local`, run the migrations, and ship.

---

## Project Architecture

| Layer | Technologies | Notes |
|-------|--------------|-------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 | Mix of server components and optimistic client interactions. |
| Auth | Auth.js v5 (credentials + passkeys), JWT strategy, Drizzle adapter | Works with WebAuthn out of the box. |
| Database | Postgres (Neon / Vercel Postgres friendly) via Drizzle ORM | Schema lives in `db/schema.ts`; migrations generated via `drizzle-kit`. |
| Styling | Tailwind CSS v4 + shadcn-inspired UI primitives | Dark/light aware, theme toggles stored in cookies. |
| Rich Text | TipTap editor with image uploads via Vercel Blob | Drafts auto-track dirty state and highlight save CTA. |
| Email | Resend | Used for contact form replies, signup verification, password/email change flows, weekly digest. |
| Analytics | Custom endpoints writing to `posts` + `daily_post_views` | Public pages increment views with cookie throttling. |
| Deployment | Vercel (recommended) | Works locally with pnpm + any Postgres instance. |

---

## Branding & Customisation (`site.ts`)

The heart of Voidwrite’s customisation lives in [`site.ts`](./site.ts). Every piece of branding—product name, taglines, footer copy, studio badges, legal headers, social links, outbound email defaults—is declared there. Newcomers can edit this single file and see the entire application realign.

Key sections inside `site.ts`:

- **`title`, `description`, `tagline`, `url`** – primary metadata for OpenGraph, favicons, sitemap, etc.
- **`studio`** – labels used inside the studio (badge text, join prompts).
- **`contact`** – default inboxes (`CONTACT_*` env vars can still override).
- **`copy.auth` / `copy.marketing`** – authentication screen text, marketing headers, newsletter fallbacks.
- **`legal`** – strings for Terms/Privacy pages and OG metadata.
- **`newsletter`** – default From/Reply-To addresses and digest subject template.
- **`project`** – optional repository link and description for the footer.

The README you are reading references these fields—set them once and deploy.

---

## Screenshots & Feature Highlights

*(Add your own screenshots here to showcase branding once you’ve customised the project.)*

- **Home Page** – async server component aggregates posts, authors, tags, and weekly leaderboard with graceful fallbacks when the database is offline.
- **Post View** – sticky share bar, author spotlight, “Stay in the loop” email capture card, “Browse topics” tag cloud.
- **Studio Dashboard** – metrics cards, views chart (7/30/90 day toggle), admin-only queues (“Submitted”, “In progress”).
- **Post Editor** – TipTap-based WYSIWYG, auto slugging, SEO helpers, admin-only publish controls, comment threads, assignment flow.
- **Notifications** – assignment/submission/approval/comment events, optimistic UI updates.
- **Settings** – profile management, avatar upload to Vercel Blob, passkey management, password change, email change flow (double verification).

Live public demo: **https://voidwrite.farouk.uk/**

---

## Environment Variables

All secrets live in `.env.local` for local development. Below is a redacted template—copy it to `.env.local` and replace placeholders with your values.

```bash
# Database (Neon or any Postgres)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST/db?sslmode=require"

# Auth.js / NextAuth
AUTH_SECRET="openssl rand -hex 32"
NEXTAUTH_URL="http://localhost:3000"
AUTH_WEBAUTHN_RP_NAME="Your Studio Name"
AUTH_WEBAUTHN_RP_ID="localhost"
AUTH_WEBAUTHN_ORIGIN="http://localhost:3000"

# Resend (transactional email)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
CONTACT_FROM_ADDRESS="Your Brand <hello@yourdomain.com>"
CONTACT_TO_ADDRESS="inbox@yourdomain.com"

# Newsletter digest (protected endpoint)
NEWSLETTER_FROM_ADDRESS="Your Digest <newsletter@yourdomain.com>"
NEWSLETTER_REPLY_TO="inbox@yourdomain.com"
NEWSLETTER_DIGEST_SECRET="generate-a-long-random-string"

# Vercel Blob (image uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxx"

# Optional: Neon helper variables (only required if you use their templates)
PGHOST=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

> ⚠️ **Security note:** never commit real secrets. Use Vercel’s environment settings for production.

### Required vs Optional

| Variable | Required? | Used For |
|----------|-----------|---------|
| `DATABASE_URL` | ✅ | Drizzle / Postgres connection |
| `AUTH_SECRET` | ✅ | Auth.js JWT encryption/signing |
| `RESEND_API_KEY` | ✅ (if using email features) | signup/contact/password flows |
| `BLOB_READ_WRITE_TOKEN` | ✅ (if enabling uploads) | TipTap cover uploads |
| `AUTH_WEBAUTHN_*` | ✅ when enabling passkeys | WebAuthn Relying Party metadata |
| `NEWSLETTER_DIGEST_SECRET` | Optional but recommended | Protects weekly digest trigger |

The repo also includes the Neon convenience variables (`POSTGRES_*`, `NEXT_PUBLIC_STACK_*`, etc.). They are not required unless you rely on Neon’s client libraries.

---

## Getting Started Locally

```bash
pnpm install
cp .env.local.example .env.local   # create and fill with your values
pnpm db:generate                   # optional: sync types/migrations
pnpm db:migrate                    # apply migrations to your database
pnpm dev                           # http://localhost:3000
```

> If you cloned the live demo, run `pnpm build` once to ensure everything type-checks under your configuration.

### Seeding an Admin Account

```bash
# With env vars set, run:
pnpm tsx scripts/seed.ts
```

This script looks for `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (define them in `.env.local`) and creates the first user. The very first profile automatically becomes an admin+master account.

---

## Database & Drizzle ORM

- Schema: [`db/schema.ts`](./db/schema.ts)
- Auth tables: [`db/auth-schema.ts`](./db/auth-schema.ts)
- Config: [`drizzle.config.ts`](./drizzle.config.ts)

### Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate migration SQL from the schema |
| `pnpm db:migrate` | Apply migrations (invokes `drizzle-kit push`) |
| `pnpm tsx scripts/check-auth.ts` | Quick credential check script |

Voidwrite intentionally separates Auth.js tables from profile data to keep editorial fields flexible. The `profiles` table holds role, username, passkey metadata, suspension flag, etc.

---

## Authentication & Passkeys

- **Credentials provider** for classic email/password sign-in.
- **Passkey provider** (`@simplewebauthn`) for passwordless authentication.
- **Middleware-based role gating** ensures studio routes are accessible to `admin` and `editor` roles only. Admin tier unlocks invite codes, global settings, tag management, and hard deletes.
- **Suspension** is enforced at sign-in time and via the middleware (suspended users are redirected back to `/signin?error=suspended`).

Update the `AUTH_WEBAUTHN_*` env vars to match your domain when deploying; they default to the hostname parsed from `NEXTAUTH_URL`.

---

## File Uploads & Media Handling

Image uploads (cover images, avatars) flow through [`app/api/upload/route.ts`](./app/api/upload/route.ts) and are stored on Vercel Blob with multiple pre-generated WebP variants (1600w/1280w/640w/320w). Only authenticated staff can hit this endpoint.

Set `BLOB_READ_WRITE_TOKEN` in your environment to enable uploads.

---

## Email & Newsletter Digest

- **Resend** powers transactional emails (signup verification, password reset, email change, contact form).
- **Weekly digest**: [`app/api/newsletter/digest/route.ts`](./app/api/newsletter/digest/route.ts) aggregates the most viewed/published posts for the last seven days and sends personalised emails with HTML + plain-text versions generated from `lib/newsletter.ts`.
- Protect the digest endpoint by setting `NEWSLETTER_DIGEST_SECRET` and calling it with `Authorization: Bearer <secret>` from your scheduler (cron, GitHub Action, etc.).

The email templates pull brand colours, friendly copy, and CTA text directly from `site.ts`.

---

## Analytics & Post Views

Every article request (from the client) hits `/api/views` with the slug. The route:

1. Looks up the post ID via Drizzle.
2. Increments a view counter with `sql
e` expressions.
3. Upserts a daily total into `daily_post_views` for charting.
4. Sets a 24-hour cookie (`vw_<id>` client-side + `localStorage`) to avoid double counting.

The studio dashboard consumes `/api/analytics/views` to render the chart. It sums counts across the requested range (7/30/90 days) and falls back to the total when daily history is missing.

---

## Deployment Checklist

1. **Provision Postgres** (Neon, Supabase, Railway, etc.) and set `DATABASE_URL`.
2. **Configure secrets** in Vercel (or your platform): `AUTH_SECRET`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `AUTH_WEBAUTHN_*`, newsletter/contact addresses, etc.
3. **Run migrations** during deployment (`pnpm db:migrate`).
4. **Set NEXTAUTH_URL** to your production domain.
5. **Update `site.ts`** with your brand. You can ship without touching React/TSX files.
6. Optional: schedule weekly digest by calling `POST /api/newsletter/digest` with the bearer token.

> Tipp: Keep a separate `.env.production` or use Vercel’s Environment Variable UI to avoid leaking secrets in the repo.

---

## Contributing & Support

Pull requests and issues are welcome—Voidwrite is open source and meant to be adapted. If you launch your own branded newsroom on top of this starter, let me know!

For direct support, consulting, or integration questions: **me@farouk.uk**

---

Happy publishing! 🎙️
