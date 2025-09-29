"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { siteConfig } from "@/site";

type StoredSignup = {
  email: string;
  password: string;
  name?: string | null;
  inviteCode?: string | null;
};

const STORAGE_KEY = `${siteConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-signup`;

export default function VerifySignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stored, setStored] = useState<StoredSignup | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [infoMissing, setInfoMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setInfoMissing(true);
        return;
      }
      const parsed = JSON.parse(raw) as StoredSignup;
      setStored(parsed);
    } catch {
      setInfoMissing(true);
    }
  }, []);

  const email = useMemo(() => {
    if (emailParam) return emailParam;
    return stored?.email || "";
  }, [emailParam, stored?.email]);

  useEffect(() => {
    if (!email) return;
    document.title = `Verify ${email} | ${siteConfig.title}`;
  }, [email]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setInfoMissing(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Verification failed");
      }
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      const creds = stored;
      if (creds) {
        await signIn("credentials", {
          email: creds.email,
          password: creds.password,
          callbackUrl: "/studio",
        });
      } else {
        router.push("/signin");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!stored || !stored.email || !stored.password) {
      setInfoMissing(true);
      return;
    }
    setResendLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: stored.email,
          password: stored.password,
          name: stored.name ?? undefined,
          inviteCode: stored.inviteCode ?? undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to resend code");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email || infoMissing) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="mx-auto w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Email verification expired</CardTitle>
            <CardDescription>
              We couldn&apos;t find your signup request. Start again to receive a new verification code.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-6">
            <Button asChild>
              <Link href="/signup">Start over</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="mx-auto w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="font-heading text-3xl">Verify your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below to finish creating your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || code.length < 4}>
                {loading ? "Verifying…" : "Verify and continue"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Didn&apos;t get the code?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={onResend}
                disabled={resendLoading}
              >
                {resendLoading ? "Sending…" : "Resend email"}
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6 text-sm text-muted-foreground">
            Wrong email? <Link href="/signup" className="ml-1 text-foreground underline">Start over</Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
