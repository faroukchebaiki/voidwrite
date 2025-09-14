import { auth } from "@/auth-app";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { authenticators } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import SettingsSingle from "@/components/SettingsSingle";

export default async function StudioSettings() {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  const email = (session?.user as any)?.email as string | undefined;
  const [site] = await db.select().from(settings).limit(1);
  const passkeys = uid ? await db.select().from(authenticators).where(eq(authenticators.userId, uid)) : [];
  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mx-auto w-full max-w-3xl">
        <SettingsSingle account={{ email }} passkeys={passkeys as any} />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
