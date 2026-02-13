import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    })

    const { pathname } = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Define the platform domain (adjust for local development if needed)
    // In production: platform.meridian.social
    // In local: platform.localhost:3000 (you need to edit hosts file)
    const isPlatform = hostname.startsWith('platform.')

    // -----------------------------------------------------------------------------
    // LANDING PAGE ROUTING (meridian.social)
    // -----------------------------------------------------------------------------
    if (!isPlatform) {
        // If on landing domain, but trying to access platform routes -> Redirect to platform
        if (
            pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname.startsWith('/admin') ||
            pathname.startsWith('/portal') ||
            pathname.startsWith('/setup')
        ) {
            const url = new URL(request.url)
            // Strip 'www.' if present before adding 'platform.'
            const cleanHostname = url.hostname.replace(/^www\./, '')
            url.hostname = `platform.${cleanHostname}`
            return NextResponse.redirect(url)
        }

        // Allow access to landing page (app/page.tsx)
        return NextResponse.next()
    }

    // -----------------------------------------------------------------------------
    // PLATFORM ROUTING (platform.meridian.social)
    // -----------------------------------------------------------------------------

    // If on platform, root '/' should redirect to login or dashboard
    if (pathname === '/') {
        if (token) {
            const redirectUrl = token.role === 'ADMIN' ? '/admin' : '/portal'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Public routes on Platform
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/setup') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static')
    ) {
        // If logged in and trying to access login, redirect to appropriate dashboard
        if (token && pathname.startsWith('/login')) {
            const redirectUrl = token.role === 'ADMIN' ? '/admin' : '/portal'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        return NextResponse.next()
    }

    // Protected routes logic
    if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Role-based protection
    if (pathname.startsWith('/admin')) {
        if (token.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/portal', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (ALL API routes - they handle their own auth via getServerSession)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
