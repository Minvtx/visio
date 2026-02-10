import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    })

    const { pathname } = request.nextUrl

    // Public routes - allow access
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/setup') ||
        pathname.startsWith('/api/auth') ||
        pathname === '/'
    ) {
        // If logged in and trying to access login, redirect to appropriate dashboard
        if (token && pathname.startsWith('/login')) {
            const redirectUrl = token.role === 'ADMIN' ? '/admin' : '/portal'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        return NextResponse.next()
    }

    // Not logged in - redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Admin routes - only ADMIN role
    if (pathname.startsWith('/admin')) {
        if (token.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/portal', request.url))
        }
    }

    // Portal routes - only CLIENT role (or ADMIN can access too)
    if (pathname.startsWith('/portal')) {
        // Both ADMIN and CLIENT can access portal
        // But CLIENT cannot access admin
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
}
