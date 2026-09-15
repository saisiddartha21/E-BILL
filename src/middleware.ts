import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-for-development');

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths
  const isPublicPath = path === '/login' || path === '/api/auth/login' || path.startsWith('/_next') || path.startsWith('/favicon.ico');
  const isApiRoute = path.startsWith('/api/');

  const token = request.cookies.get('auth-token')?.value;

  if (isPublicPath) {
    if (token && path === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-name', payload.name as string);

    // Role-based access control for API routes
    if (isApiRoute) {
      const role = payload.role as string;
      const method = request.method;

      if (role === 'STAFF') {
        if (
          path.startsWith('/api/users') ||
          (path.startsWith('/api/settings') && method !== 'GET') ||
          path.startsWith('/api/stock/adjust') ||
          path.startsWith('/api/backup') ||
          path.startsWith('/api/audit-logs')
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Token is invalid, redirect to login and clear cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
