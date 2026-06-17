import { NextResponse } from 'next/server'
import { verifyAdminPassword } from '../../../../lib/adminPassword'

const sessionCookieName = 'jebar_admin_session'

export async function POST(request: Request) {
  const sessionToken = process.env.ADMIN_SESSION_TOKEN || process.env.ADMIN_PASSWORD
  const body = await request.json().catch(() => ({}))

  if (!sessionToken) {
    return NextResponse.json({ ok: false, message: 'ยังไม่ได้ตั้งค่า ADMIN_PASSWORD' }, { status: 500 })
  }

  if (!(await verifyAdminPassword(body?.password || ''))) {
    return NextResponse.json({ ok: false, message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookieName, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 14,
    path: '/'
  })

  return response
}
