import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth-middleware';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // If a signed-in user visits signin/signup, send them to Studio
  if (pathname === '/signin' || pathname === '/signup') {
    const session = await auth();
    if (session?.user) {
      const url = new URL('/studio', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith('/studio')) return NextResponse.next();

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'admin' && role !== 'editor')) {
    const loginUrl = new URL('/signin', req.url);
    return NextResponse.redirect(loginUrl);
  }
  // Admin-only sections: all posts listing, tags management, invite codes, pending queue
  const adminExact = ['/studio/posts', '/studio/tags', '/studio/invite', '/studio/pending'];
  const adminPrefixes = ['/studio/posts/', '/studio/tags/', '/studio/invite/', '/studio/pending/'];
  if (role !== 'admin') {
    const segments = pathname.split('/').filter(Boolean);
    const isPostDetail = segments[0] === 'studio' && segments[1] === 'posts' && segments.length === 3;
    const isAdminExact = adminExact.includes(pathname);
    const isAdminPrefixed = adminPrefixes.some((prefix) => pathname.startsWith(prefix) && !pathname.startsWith('/studio/posts/new'));
    if ((isAdminExact || isAdminPrefixed) && !isPostDetail) {
      return NextResponse.redirect(new URL('/studio/my-blogs', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/signin', '/signup'],
};
