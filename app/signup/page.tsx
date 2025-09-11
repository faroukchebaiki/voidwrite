"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'admin' | 'editor' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, role: role || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to sign up");
      }
      await signIn("credentials", { email, password, callbackUrl: "/studio" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Role</label>
          <div className="flex items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} />
              <span>Admin</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="role" value="editor" checked={role === 'editor'} onChange={() => setRole('editor')} />
              <span>Author</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Choose Admin or Author. If omitted, you’ll be Author.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full bg-black text-white rounded py-2">{loading? 'Creating…' : 'Create account'}</button>
      </form>
      <div className="my-4 text-center text-sm text-gray-500">or</div>
      <button onClick={() => signIn("passkey", { callbackUrl: "/studio" })} className="w-full border rounded py-2">Continue with Passkey</button>
      <p className="text-sm text-gray-500 mt-4">Have an account? <Link href="/signin" className="underline">Sign in</Link></p>
    </main>
  );
}
