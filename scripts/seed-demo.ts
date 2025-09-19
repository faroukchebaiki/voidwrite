import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();
import { eq } from "drizzle-orm";

let db: any;
let users: any;
let profiles: any;
let posts: any;
let tags: any;
let hashPassword: (p: string)=>Promise<string>;

async function ensureUser(email: string, name: string, role: 'admin'|'editor', isMaster = false) {
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return existing;
  const [u] = await db.insert(users).values({ email, name }).returning();
  const hash = await hashPassword("password123!");
  await db.insert(profiles).values({ userId: u.id, role: role as any, passwordHash: hash, isMaster });
  return u;
}

function lorem(n = 1) {
  const base = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  return Array.from({ length: n }).map(() => base).join("\n\n");
}

async function createPost(authorId: string, title: string, status: 'draft'|'submitted'|'published') {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2,6);
  const now = new Date();
  const [p] = await db.insert(posts).values({
    title,
    slug,
    excerpt: "" + title,
    content: lorem(3),
    status: status as any,
    authorId,
    createdBy: authorId,
    coverImageUrl: null,
    publishedAt: status === 'published' ? now : null,
    updatedAt: now,
  }).returning();
  return p;
}

async function main() {
  // Dynamic imports after env is loaded
  const dbmod = await import('../db');
  db = dbmod.db;
  const authSchema = await import('../db/auth-schema');
  users = authSchema.users;
  const cms = await import('../db/schema');
  profiles = cms.profiles; posts = cms.posts; tags = cms.tags;
  hashPassword = (await import('../lib/password')).hashPassword;
  console.log("Seeding demo data…");
  // Ensure at least one master admin exists
  const existing = await db.select().from(users).limit(1);
  if (existing.length === 0) {
    await ensureUser("master@voidwrite.local", "Master Admin", 'admin', true);
  }
  // Create two more admins
  const admin1 = await ensureUser("admin1@voidwrite.local", "Admin One", 'admin');
  const admin2 = await ensureUser("admin2@voidwrite.local", "Admin Two", 'admin');
  // Create six authors
  const authors = await Promise.all(
    [1,2,3,4,5,6].map((i) => ensureUser(`author${i}@voidwrite.local`, `Author ${i}`, 'editor'))
  );

  // Basic tags
  const seedTags = [
    { name: 'General', slug: 'general' },
    { name: 'News', slug: 'news' },
    { name: 'Tips', slug: 'tips' },
  ];
  const existingTags = await db.select().from(tags);
  const existingSlugs = new Set(existingTags.map((t:any)=>t.slug));
  if (existingTags.length < seedTags.length) {
    await db.insert(tags).values(seedTags.filter(t=>!existingSlugs.has(t.slug)) as any);
  }
  // Create posts for each author
  for (const a of [admin1, admin2, ...authors]) {
    await createPost(a.id, `Welcome from ${a.name || a.email}`, 'draft');
    await createPost(a.id, `Getting started ${Math.random().toString(36).slice(2,5)}`, 'draft');
    await createPost(a.id, `My journey ${Math.random().toString(36).slice(2,5)}`, 'published');
    await createPost(a.id, `Tips and tricks ${Math.random().toString(36).slice(2,5)}`, 'published');
  }

  console.log("✔ Demo data seeded.");
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });
