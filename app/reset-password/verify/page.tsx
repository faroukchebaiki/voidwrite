"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

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
import { passwordComplexityRegex, PASSWORD_COMPLEXITY_MESSAGE } from "@/lib/validation";

const STORAGE_KEY = `${siteConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-reset`;

export default function VerifyResetPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") || "";
  const [stored, setStored] = useState<{ email: string } | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const passwordIsValid = passwordComplexityRegex.test(newPassword);
  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setStored(JSON.parse(raw));
      }
    } catch {
      setStored(null);
    }
  }, []);

  const email = useMemo(() => {
    if (emailParam) return emailParam;
    return stored?.email || "";
  }, [emailParam, stored?.email]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      setError('Reset session expired. Start again.');
      return;
    }
    if (!passwordComplexityRegex.test(newPassword)) {
      setPasswordTouched(true);
      setError(PASSWORD_COMPLEXITY_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/password/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim(), newPassword }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error((detail as any)?.error || 'Failed to reset password.');
      }
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      await signIn('credentials', { email, password: newPassword, callbackUrl: '/studio' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/10 px-4 py-16">
        <Card className="mx-auto w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>Reset session expired</CardTitle>
            <CardDescription>
              We couldn’t find your reset request. Start again to receive a new code.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-6">
            <Button asChild>
              <Link href="/reset-password">Start over</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 px-4 py-16">
      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-heading text-3xl">Verify code</CardTitle>
          <CardDescription>
            Enter the code sent to <span className="font-medium text-foreground">{email}</span> and choose a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="reset-code" className="text-sm font-medium">Verification code</label>
              <Input
                id="reset-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="reset-password" className="text-sm font-medium">New password</label>
              <Input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                onBlur={() => setPasswordTouched(true)}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">{siteConfig.copy.settings.passwordHint}</p>
              {passwordTouched && !passwordIsValid && (
                <p className="text-xs text-destructive">{PASSWORD_COMPLEXITY_MESSAGE}</p>
              )}
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="reset-password-confirm" className="text-sm font-medium">Confirm password</label>
              <Input
                id="reset-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onBlur={() => setConfirmTouched(true)}
                maxLength={100}
                required
              />
              {confirmTouched && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords must match.</p>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                Show passwords
              </label>
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              >
                Resend code
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                code.length < 4 ||
                !passwordIsValid ||
                !confirmPassword ||
                !passwordsMatch
              }
            >
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Remembered it? <Link href="/signin" className="ml-1 text-foreground underline">Back to sign in</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
