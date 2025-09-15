import { auth } from "../auth-app";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as (typeof session.user) & { id: string; role?: string };
}

// Staff = admin or editor
export async function requireStaff() {
  const user = await requireUser();
  if (!user) return null;
  const role = (user as any).role;
  if (role !== "admin" && role !== "editor") return null;
  return user;
}

// Admin only
export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;
  if ((user as any).role !== "admin") return null;
  return user;
}

export async function isMaster(userId: string) {
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return !!p?.isMaster;
}
