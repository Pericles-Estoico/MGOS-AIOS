import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './lib/logger';

const protectedPaths = ['/dashboard', '/team', '/settings', '/marketplace'];
const publicPaths = ['/login', '/api/auth', '/api/health'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect unauthenticated users to login
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!token) {
      logger.warn({ pathname }, 'Unauthenticated access attempt');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    logger.info({ pathname, role: token.role }, 'Authenticated request');

    // Check role-based access
    if (pathname.startsWith('/team')) {
      const allowedRoles = ['admin', 'head'];
      if (!allowedRoles.includes(token.role as string)) {
        logger.warn({ pathname, role: token.role }, 'Access denied: insufficient role');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (pathname.startsWith('/settings') && token.role !== 'admin') {
      logger.warn({ pathname, role: token.role }, 'Access denied: admin only');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|api/(?!auth)).*)',
  ],
};
