import { db } from "../db";
import { users } from "../db/auth-schema";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../lib/password";

const email = process.env.CHECK_EMAIL || "admin@voidwrite.local";
const pass = process.env.CHECK_PASS || "";

async function main() {
  const [u] = await db.select().from(users).where(eq(users.email, email));
  console.log("user?", !!u, u && { id: u.id, email: u.email });
  if (!u) return;
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, u.id));
  console.log("profile?", !!p, p && { role: p.role, hasHash: !!p.passwordHash });
  if (!p?.passwordHash) return;
  if (!pass) {
    console.log("No CHECK_PASS provided; skipping verify.");
    return;
  }
  const ok = await verifyPassword(p.passwordHash, pass);
  console.log("verify:", ok);
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});

