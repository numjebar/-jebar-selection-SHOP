import { NextResponse } from 'next/server'
import { saveAdminPassword, verifyAdminPassword } from '../../../../lib/adminPassword'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const currentPassword = String(body?.currentPassword || '')
  const newPassword = String(body?.newPassword || '')

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, message: 'รหัสใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 })
  }

  if (!(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ ok: false, message: 'รหัสเดิมไม่ถูกต้อง' }, { status: 401 })
  }

  try {
    const result = await saveAdminPassword(newPassword)
    return NextResponse.json({
      ok: true,
      mode: result.mode,
      message: result.mode === 'cloud' ? 'เปลี่ยนรหัสผ่านแล้ว' : 'เปลี่ยนรหัสผ่านชั่วคราวแล้ว'
    })
  } catch {
    return NextResponse.json({ ok: false, message: 'บันทึกรหัสใหม่ไม่สำเร็จ' }, { status: 500 })
  }
}
