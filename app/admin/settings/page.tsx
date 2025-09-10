import { db } from "@/db";
import { settings } from "@/db/schema";
import SettingsForm from "./settingsForm";

export default async function AdminSettings() {
  const [site] = await db.select().from(settings).limit(1);
  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsForm initial={site ?? null} />
    </main>
  );
}
export const dynamic = 'force-dynamic';
