"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const fillAdmin = () => {
    setEmail("admin@voidwrite.local");
    setPassword("OWjZAkXNGE6LodqEjyw80Mgm");
  };
  const fillAuthor = () => {
    setEmail("lklke@ksl.com");
    setPassword("1234567890");
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("credentials", { email, password, callbackUrl: "/admin" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fillAdmin} className="border rounded px-2 py-1 text-xs">Use Admin Demo</button>
          <button type="button" onClick={fillAuthor} className="border rounded px-2 py-1 text-xs">Use Author Demo</button>
        </div>
        <button disabled={loading} className="w-full bg-black text-white rounded py-2">{loading? 'Signing in...' : 'Sign in'}</button>
      </form>
      <div className="my-4 text-center text-sm text-gray-500">or</div>
      <button onClick={() => signIn("passkey", { callbackUrl: "/admin" })} className="w-full border rounded py-2">Continue with Passkey</button>
      <p className="text-sm text-gray-500 mt-4">No account? <Link href="/signup" className="underline">Sign up</Link></p>
    </main>
  );
}
