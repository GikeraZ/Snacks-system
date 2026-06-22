import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/unauthorized',
  '/api/auth',
  '/api/manifest',
  '/api/logo',
  '/api/images',
  '/api/payments/mpesa-callback',
  '/api/payments/mpesa-status',
  '/api/qr',
]

const roleRoutes: Record<string, string[]> = {
  '/admin': ['SUPER_ADMIN', 'BUSINESS_PARTNER'],
  '/cashier': ['SUPER_ADMIN', 'CASHIER'],
  '/kitchen': ['SUPER_ADMIN', 'KITCHEN_STAFF'],
  '/delivery': ['SUPER_ADMIN', 'DELIVERY'],
  '/customer': ['SUPER_ADMIN', 'CUSTOMER'],
  '/partner': ['SUPER_ADMIN', 'BUSINESS_PARTNER'],
}

export default async function handler(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = publicPaths.some(p => pathname.startsWith(p))
  if (isPublic) {
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    return response
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  const role = token.role as string
  const matchedRoute = Object.entries(roleRoutes).find(([route]) => pathname.startsWith(route))

  if (matchedRoute && !matchedRoute[1].includes(role)) {
    const response = NextResponse.rewrite(new URL('/auth/unauthorized', req.url))
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  if (token.isActive === false) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('error', 'AccountDisabled')
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    return response
  }

  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|manifest.json|sw.js|api/manifest|api/logo|api/images|api/payments/mpesa-callback|api/payments/mpesa-status|api/qr).*)'],
}
