import { auth } from "@/auth-app";
import { db } from "@/db";
import { authenticators } from "@/db/auth-schema";
import { passkeyLabels } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SettingsSingle from "@/components/SettingsSingle";
import { siteConfig } from "@/site";

export default async function StudioSettings() {
  const session = await auth();
  const uid = (session?.user as any)?.id as string | undefined;
  const email = (session?.user as any)?.email as string | undefined;
  const name = (session?.user as any)?.name as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;
  if (uid) {
    await db.execute(sql`
      create table if not exists passkey_labels (
        credential_id text primary key,
        user_id text not null,
        label text not null,
        updated_at timestamp not null default now()
      );
    `);
  }
  const passkeys = uid
    ? await db
        .select({
          credentialID: authenticators.credentialID,
          counter: authenticators.counter,
          label: passkeyLabels.label,
        })
        .from(authenticators)
        .leftJoin(passkeyLabels, eq(passkeyLabels.credentialId, authenticators.credentialID))
        .where(eq(authenticators.userId, uid))
    : [];
  return (
    <main className="space-y-3 overflow-x-hidden">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mx-auto w-full max-w-3xl overflow-x-hidden">
        {role === 'admin' && (
          <section className="mb-10 space-y-4 rounded-lg border bg-card p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Site metadata</h2>
              <p className="text-sm text-muted-foreground">
                Global branding is defined in <code className="rounded bg-muted px-1.5 py-0.5">site.ts</code> at the project root.
                Edit that file to change the site title, description, tagline, or social links.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {siteConfig.title}
              </div>
              <div>
                <span className="font-medium">Description:</span> {siteConfig.description}
              </div>
              <div>
                <span className="font-medium">Tagline:</span> {siteConfig.tagline}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Changes take effect immediately after redeploying or restarting the app.
            </p>
          </section>
        )}
        <SettingsSingle account={{ email, name, id: uid }} passkeys={passkeys as any} />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
