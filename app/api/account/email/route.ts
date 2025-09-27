import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Use /api/account/email/start and /confirm." }, { status: 405 });
}
