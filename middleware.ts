import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth-middleware';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'admin' && role !== 'editor')) {
    const loginUrl = new URL('/signin', req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
