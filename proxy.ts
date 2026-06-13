import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicPaths = ['/auth/login', '/auth/register', '/auth/unauthorized', '/api/auth', '/api/manifest', '/api/logo', '/api/images']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = publicPaths.some(p => pathname.startsWith(p))
  if (isPublic) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const role = token.role as string

  if (pathname.startsWith('/admin')) {
    if (role !== 'SUPER_ADMIN' && role !== 'BUSINESS_PARTNER') {
      return NextResponse.rewrite(new URL('/auth/unauthorized', req.url))
    }
  }

  if (pathname.startsWith('/cashier')) {
    if (role !== 'SUPER_ADMIN' && role !== 'CASHIER') {
      return NextResponse.rewrite(new URL('/auth/unauthorized', req.url))
    }
  }

  if (pathname.startsWith('/kitchen')) {
    if (role !== 'SUPER_ADMIN' && role !== 'KITCHEN_STAFF') {
      return NextResponse.rewrite(new URL('/auth/unauthorized', req.url))
    }
  }

  if (pathname.startsWith('/delivery')) {
    if (role !== 'SUPER_ADMIN' && role !== 'DELIVERY') {
      return NextResponse.rewrite(new URL('/auth/unauthorized', req.url))
    }
  }

  if (pathname.startsWith('/customer')) {
    if (role !== 'CUSTOMER' && role !== 'SUPER_ADMIN') {
      return NextResponse.rewrite(new URL('/auth/unauthorized', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|manifest.json|sw.js|api/manifest|api/logo|api/images).*)'],
}
