// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple update function that doesn't require MongoDB
function updateActiveUser(username: string) {
    // Make a fetch request to our API route
    // We're using a non-blocking approach to avoid delaying the response
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/active-users/update?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
        },
    }).catch(error => {
        console.error("Error updating active user:", error);
    });
}

export async function middleware(request: NextRequest) {
    const currentUser = request.cookies.get('user')?.value;
    const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
    const username = request.cookies.get('username')?.value;

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

    // Track active user if logged in
    if (username) {
        try {
            // Use a simplified approach that's Edge compatible
            updateActiveUser(username);
        } catch (error) {
            console.error("Error updating active user:", error);
        }
    }

    return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};