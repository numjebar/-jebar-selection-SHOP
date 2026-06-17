import './style.css'
import './hotfix.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JE BAR Selection',
  description: 'ระบบจัดการสินค้าและแคตตาล็อกขนมพร้อมเสิร์ฟวันนี้'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
