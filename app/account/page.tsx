import { auth } from "@/auth-app";
import SignOutButton from "@/components/SignOutButton";
import { db } from "@/db";
import { authenticators } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-gray-500">You must be signed in. <Link href="/signin" className="underline">Sign in</Link></p>
      </main>
    );
  }
  const uid = (session.user as any).id as string;
  const passkeys = await db.select().from(authenticators).where(eq(authenticators.userId, uid));
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-gray-500">Signed in as {session.user.email}</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-medium">Passkeys</h2>
        <div className="border rounded p-3">
          {passkeys.length === 0 && <p className="text-sm text-gray-500">No passkeys registered.</p>}
          <ul className="space-y-2">
            {passkeys.map((a) => (
              <li key={a.credentialID} className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-mono">{a.credentialID.slice(0, 10)}…</div>
                  <div className="text-gray-500">Counter: {a.counter}</div>
                </div>
                <form action={`/api/account/passkeys?credentialID=${encodeURIComponent(a.credentialID)}`} method="post">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button className="text-red-600 text-sm">Remove</button>
                </form>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Link href="/api/auth/signin?provider=passkey" className="border rounded px-3 py-1 text-sm">Register a new passkey</Link>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Security</h2>
        <form className="space-y-2" method="post" action="/api/account/password">
          <div>
            <label className="block text-sm mb-1">New password</label>
            <input className="w-full border rounded px-3 py-2" type="password" name="password" required />
          </div>
          <button className="border rounded px-3 py-2">Update password</button>
        </form>
      </section>

      <SignOutButton className="text-sm text-gray-500 underline" label="Sign out" />
    </main>
  );
}
