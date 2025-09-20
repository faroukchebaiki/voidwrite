import { db } from "../db";
import { profiles } from "../db/schema";
import { users } from "../db/auth-schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password";

async function main() {
  console.log("Seeding database…");

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• Skipping admin user (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD)");
    return;
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  if (existing) {
    console.log("• Admin user already exists:", email);
    return;
  }
  const [createdUser] = await db.insert(users).values({ email: email.toLowerCase(), name: "Admin" }).returning();
  const hash = await hashPassword(password);
  await db.insert(profiles).values({ userId: createdUser.id, role: "admin", passwordHash: hash });
  console.log("✔ Admin user created:", email);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
