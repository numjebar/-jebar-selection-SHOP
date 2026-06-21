import './style.css'
import './hotfix.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'JE BAR Selection',
  description: 'ระบบจัดการสินค้าและแคตตาล็อกขนมพร้อมเสิร์ฟวันนี้'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
