'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/site';

type Status = 'idle' | 'loading' | 'success' | 'exists' | 'error';

export default function StayInLoopCard() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({ error: 'Unable to subscribe right now.' }));
      if (!response.ok) {
        setStatus('error');
        setError(typeof data.error === 'string' ? data.error : 'Unable to subscribe right now.');
        return;
      }
      if (data.status === 'already-subscribed') {
        setStatus('exists');
      } else {
        setStatus('success');
      }
      setEmail('');
    } catch (err) {
      console.error('Newsletter subscribe failed', err);
      setStatus('error');
      setError('Something went wrong. Please try again later.');
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Stay in the loop</CardTitle>
        <CardDescription>
          Get hand-picked stories from {siteConfig.title} every Friday. No noise, just signal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'success' || status === 'exists' ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {status === 'success' ? 'You’re on the list!' : 'You’re already on the list.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Look for our weekly digest in your inbox every Friday. You can unsubscribe any time from the
              email footer.
            </p>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email address"
            />
            <Button type="submit" className="w-full" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </CardFooter>
    </Card>
  );
}
