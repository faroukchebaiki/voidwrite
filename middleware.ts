import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/studio')) return NextResponse.next();

  const user = process.env.STUDIO_BASIC_AUTH_USER;
  const pass = process.env.STUDIO_BASIC_AUTH_PASS;
  if (!user || !pass) return NextResponse.next();

  const basicAuth = req.headers.get('authorization');
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [u, p] = atob(authValue).split(':');
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Studio"' },
  });
}

export const config = {
  matcher: ['/studio/:path*'],
};

