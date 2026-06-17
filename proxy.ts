import { NextRequest, NextResponse } from 'next/server'

const sessionCookieName = 'jebar_admin_session'

export function proxy(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const sessionToken = process.env.ADMIN_SESSION_TOKEN || adminPassword
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()
  if (!adminPassword && process.env.NODE_ENV !== 'production') return NextResponse.next()

  const currentToken = request.cookies.get(sessionCookieName)?.value
  if (currentToken && currentToken === sessionToken) return NextResponse.next()

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*']
}
