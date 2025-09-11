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
  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/signin', '/signup'],
};
