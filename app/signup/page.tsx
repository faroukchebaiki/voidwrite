"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { siteConfig } from "@/site";
import { passwordComplexityRegex, PASSWORD_COMPLEXITY_MESSAGE } from "@/lib/validation";
import { Eye, EyeOff } from "lucide-react";

const STORAGE_KEY = `${siteConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-signup`;

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!passwordComplexityRegex.test(password)) {
        setPasswordTouched(true);
        setError(PASSWORD_COMPLEXITY_MESSAGE);
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setConfirmTouched(true);
        setError('Passwords must match.');
        setLoading(false);
        return;
      }
      const response = await fetch("/api/auth/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          inviteCode: inviteCode.trim() ? inviteCode.trim() : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create account");
      }
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ email, password, name, inviteCode })
        );
      } catch {}
      router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-muted px-8 py-10 text-muted-foreground">
        <div className="max-w-sm space-y-6">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-widest uppercase">
            {siteConfig.studio.inviteBadgeLabel}
          </span>
          <h1 className="font-heading text-4xl font-semibold text-foreground">
            {siteConfig.copy.auth.signUpHeadline}
          </h1>
          <p className="text-sm leading-relaxed">
            {siteConfig.copy.auth.signUpDescription}
          </p>
        </div>
        <div className="space-y-2 text-xs">
          <p>Already invited? Use the code from your editor to unlock the studio.</p>
          <p className="text-muted-foreground/80">{siteConfig.copy.auth.signUpHelper}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <Card className="mx-auto w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="font-heading text-3xl">Create your account</CardTitle>
            <CardDescription>
              Enter your details and invitation code to join {siteConfig.title}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    maxLength={100}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{siteConfig.copy.settings.passwordHint}</p>
                {passwordTouched && !passwordComplexityRegex.test(password) && (
                  <p className="text-xs text-destructive">{PASSWORD_COMPLEXITY_MESSAGE}</p>
                )}
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    maxLength={100}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmTouched && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords must match.</p>
                )}
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="invite">Invitation code <span className="text-xs text-muted-foreground">(leave blank for the first account)</span></Label>
                <Input
                  id="invite"
                  type="text"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="paste-your-code"
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Already have an account? <Link href="/signin" className="text-foreground underline">Sign in</Link>
            </p>
            <p className="text-xs">
              By creating an account you agree to the{' '}
              <Link href="/terms" className="underline">{siteConfig.title} Terms</Link>{' '}
              and acknowledge our{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
