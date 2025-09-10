import { auth } from "../auth-app";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as (typeof session.user) & { id: string; role?: string };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;
  if ((user as any).role !== "admin" && (user as any).role !== "editor") return null;
  return user;
}
