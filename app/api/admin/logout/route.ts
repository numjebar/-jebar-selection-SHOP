import { NextResponse } from 'next/server'

const sessionCookieName = 'jebar_admin_session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  })

  return response
}
