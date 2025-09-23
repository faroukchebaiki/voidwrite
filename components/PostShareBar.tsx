"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  LinkIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PostShareBar({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const encoded = useMemo(() => ({
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    text: encodeURIComponent(`${title}`),
    whatsapp: encodeURIComponent(`${title}\n${url}`),
  }), [url, title]);

  const shareLinks = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded.url}`,
      icon: Facebook,
    },
    {
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${encoded.url}&text=${encoded.text}`,
      icon: Twitter,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encoded.url}&title=${encoded.text}`,
      icon: Linkedin,
    },
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encoded.whatsapp}`,
      icon: MessageCircle,
    },
  ] as const;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-background/70 px-4 py-4 supports-[backdrop-filter]:backdrop-blur", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Share</span>
      <div className="flex flex-wrap items-center gap-2">
        {shareLinks.map(({ label, href, icon: Icon }) => (
          <Button key={label} asChild size="sm" variant="outline" className="rounded-full">
            <Link href={href} target="_blank" rel="noreferrer" aria-label={`Share on ${label}`}>
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
        ))}
        <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={handleCopy} aria-live="polite">
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <LinkIcon className="size-4" />
              Copy link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default PostShareBar;
