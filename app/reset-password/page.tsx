"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "voidwrite-reset";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/account/password/reset/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.trim() }));
      } catch {}
      setSent(true);
      setTimeout(() => {
        router.push(`/reset-password/verify?email=${encodeURIComponent(email.trim())}`);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 px-4 py-16">
      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-heading text-3xl">Forgot password</CardTitle>
          <CardDescription>
            Enter the email associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="reset-email" className="text-sm font-medium">Email address</label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {sent && <p className="text-sm text-emerald-600">We’ve sent a verification code if the email exists.</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send verification code'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Remembered your password? <Link href="/signin" className="ml-1 text-foreground underline">Back to sign in</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
