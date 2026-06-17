'use client'

import { FormEvent, useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '../../../components/AppUi'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        signal: controller.signal
      })

      window.clearTimeout(timeout)

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setMessage(data?.message || 'เข้าสู่ระบบไม่สำเร็จ')
        setIsSubmitting(false)
        return
      }

      const nextPath = new URLSearchParams(window.location.search).get('next') || '/admin/products'
      window.location.href = nextPath.startsWith('/admin') ? nextPath : '/admin/products'
    } catch {
      window.clearTimeout(timeout)
      setMessage('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="loginPage">
      <section className="loginCard surface">
        <BrandLogo />
        <div>
          <p className="kicker">สำหรับเจ้าของร้านและทีมงาน</p>
          <h1>เข้าสู่ระบบหลังบ้าน</h1>
          <p className="muted">กรอกรหัสผ่านเพื่อจัดการสินค้า แคตตาล็อก และข้อความของร้าน</p>
        </div>

        <form className="loginForm" onSubmit={handleSubmit}>
          <label>
            <span>รหัสผ่าน</span>
            <div className="passwordField">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value.trim())}
                autoComplete="current-password"
                autoFocus
              />
              <button
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="passwordToggle"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {message ? <p className="warningBox">{message}</p> : null}
          <button className="button darkButton fullWidth" disabled={isSubmitting || !password} type="submit">
            <LockKeyhole size={17} />
            {isSubmitting ? 'กำลังตรวจสอบ' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </section>
    </main>
  )
}
