import { NextResponse } from "next/server";
import { auth } from "@/auth-app";
import { db } from "@/db";
import { authenticators } from "@/db/auth-schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  // Support method override for DELETE via form
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const method = url.searchParams.get("_method")?.toUpperCase();
  if (method === "DELETE") return DELETE(req);
  return new NextResponse("Method not allowed", { status: 405 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const credentialID = url.searchParams.get("credentialID");
  if (!credentialID) return new NextResponse("Missing credentialID", { status: 400 });
  const uid = (session.user as any).id as string;
  await db.delete(authenticators).where(
    and(eq(authenticators.userId, uid), eq(authenticators.credentialID, credentialID))
  );
  return NextResponse.redirect(new URL("/studio", req.url));
}
