// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const currentUser = request.cookies.get('user')?.value;
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';

    // Define public paths that don't require authentication
    const publicPaths = ['/login'];

    // Define admin-only paths
    const adminPaths = ['/admin'];

    // Define paths that logged-in users can access even without setup
    const setupAllowedPaths = ['/setup-profile'];

    const path = request.nextUrl.pathname;

    // Check if the path is in the admin-only paths
    const isAdminPath = adminPaths.some(ap => path.startsWith(ap));

    // Check if the path is a public path
    const isPublicPath = publicPaths.some(pp => path.startsWith(pp));

    // Check if the path is allowed during setup
    setupAllowedPaths.some(sp => path.startsWith(sp));
// If the user is trying to access a protected route without being logged in
    if (!currentUser && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If the user is trying to access an admin route without being an admin
    if (isAdminPath && !isAdmin) {
        return NextResponse.redirect(new URL('/calendar', request.url));
    }

    // If the user is logged in and trying to access the login page
    if (currentUser && isPublicPath) {
        return NextResponse.redirect(new URL('/calendar', request.url));
    }

    return NextResponse.next();
}

// Only run middleware on specific paths - exclude API routes and static assets
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - /_not-found (built-in 404 page)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|_not-found).*)',
    ],
};