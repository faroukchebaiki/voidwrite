"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn as signInCredentials } from "next-auth/react";
import { signIn as signInPasskey } from "next-auth/webauthn";

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
import { Label } from "@/components/ui/label";
import { SuspendedBanner } from "@/components/login-banner";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInCredentials("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/studio",
      });
      if (result?.error) {
        if (result.error === "AccessDenied") {
          setErrorMessage("Your account has been suspended. Please contact an administrator.");
        } else {
          setErrorMessage("Incorrect email or password. Please try again.");
        }
        return;
      }
      if (result?.url && result.url.includes("error=")) {
        setErrorMessage("Your account has been suspended. Please contact an administrator.");
        return;
      }
      const url = result?.url ?? "/studio";
      router.push(url);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const onPasskey = async () => {
    setPasskeyError(null);
    setPasskeyLoading(true);
    try {
      await signInPasskey("passkey", { callbackUrl: "/studio" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start passkey sign-in.";
      setPasskeyError(message);
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-muted px-8 py-10 text-muted-foreground">
        <div className="max-w-sm space-y-6">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-widest uppercase">
            Voidwrite Studio
          </span>
          <h1 className="font-heading text-4xl font-semibold text-foreground">
            Welcome back to your editorial desk
          </h1>
          <p className="text-sm leading-relaxed">
            Sign in to manage posts, assign stories, and keep the newsroom moving. Collaborate with your team in real time and publish with confidence.
          </p>
        </div>
        <div className="space-y-2 text-xs">
          <p>Need an account? <Link href="/signup" className="font-medium text-foreground underline">Request access</Link></p>
          <p className="text-muted-foreground/80">Protected workspace for Voidwrite contributors.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <Card className="mx-auto w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="font-heading text-3xl">Sign in</CardTitle>
            <CardDescription>
              Use your credentials to access the Voidwrite studio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuspendedBanner error={searchParams.get("error")}
            />
            {searchParams.get("error") ? <div className="h-4" /> : null}
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email or username</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@voidwrite.com"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <div className="text-right text-xs">
                  <Link href="/reset-password" className="text-foreground underline">Forgot password?</Link>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
            </form>
            <div className="my-6 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <div className="h-px flex-1 bg-muted-foreground/30" />
              <span>or continue with</span>
              <div className="h-px flex-1 bg-muted-foreground/30" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onPasskey}
              disabled={passkeyLoading}
            >
              {passkeyLoading ? "Waiting for passkey…" : "Use a passkey"}
            </Button>
            {passkeyError && (
              <p className="mt-2 text-center text-sm text-destructive">{passkeyError}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              New to Voidwrite? <Link href="/signup" className="text-foreground underline">Create an account</Link>
            </p>
            <p className="text-xs">
              By continuing, you agree to the Voidwrite Terms and acknowledge our Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
