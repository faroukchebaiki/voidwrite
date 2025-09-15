import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/auth-schema";
import { profiles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  const rows = await db.select({ u: users, p: profiles }).from(users).leftJoin(profiles, eq(profiles.userId, users.id));
  const list = rows.map((r: any) => ({ id: r.u.id, email: r.u.email, name: r.u.name, image: r.u.image, role: r.p?.role, username: r.p?.username, suspended: !!r.p?.suspended, isMaster: !!r.p?.isMaster }));
  return NextResponse.json(list);
}

