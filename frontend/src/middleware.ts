import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Get the token from the cookie
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 2. PROTECTED ROUTES (Dashboard)
    // If trying to access dashboard WITHOUT a token -> Kick to Login
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. PUBLIC ROUTES (Login / Home)
    // If trying to access login/home WITH a token -> Kick to Dashboard
    if (pathname === '/login' || pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // 4. THE FIX: Cache Control
    // We create a response object so we can modify its headers
    const response = NextResponse.next();

    // If we are on the dashboard, force the browser to NEVER cache this page.
    // This ensures that clicking "Back" triggers a new request to the server (which will fail auth).
    if (pathname.startsWith('/dashboard')) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Surrogate-Control', 'no-store');
    }

    return response;
}

// Configuration: Run on dashboard, login, and home
export const config = {
    matcher: ['/dashboard/:path*', '/login', '/'],
};