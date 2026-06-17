'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { Download, Link2, MessageCircle, MessagesSquare, Printer, Send } from 'lucide-react'
import { toPng } from 'html-to-image'
import { CatalogPoster, Sidebar } from '../../../components/AppUi'
import { getAvailableProducts, getTodayLabel } from '../../../lib/catalogData'
import { useCatalogStore } from '../../../lib/useCatalogStore'

export default function CatalogBuilderPage() {
  const { products, selection, messages } = useCatalogStore()
  const todayProducts = getAvailableProducts(products, selection)
  const posterRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState('')
  const customerUrl = typeof window === 'undefined' ? '/catalog' : `${window.location.origin}/catalog`
  const lineUrl = process.env.NEXT_PUBLIC_LINE_OA_URL || process.env.NEXT_PUBLIC_LINE_URL || 'https://lin.ee/t8QoAix'
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_INBOX_URL || process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/102339796492016'

  function printCatalog() {
    window.print()
  }

  async function downloadCatalogImage() {
    if (!posterRef.current) return

    setIsDownloading(true)

    try {
      await waitForImages(posterRef.current)
      const restoreImages = await embedImagesForDownload(posterRef.current)

      try {
        const dataUrl = await toPng(posterRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#f2dfbf',
          quality: 1
        })
        const link = document.createElement('a')
        link.download = `je-bar-catalog-${new Date().toISOString().slice(0, 10)}.png`
        link.href = dataUrl
        link.click()
      } finally {
        restoreImages()
      }
    } catch (error) {
      console.error(error)
      alert('ดาวน์โหลดรูปไม่สำเร็จ กรุณาลองใหม่ หรือใช้ปุ่มพิมพ์ / PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(customerUrl)
    setCopied('ลิงก์')
  }

  async function copyCustomerMessage(channel: string) {
    await navigator.clipboard.writeText(messages.sendToCustomerMessage.replace('{catalogUrl}', customerUrl))
    setCopied(channel)
  }

  return (
    <main className="appFrame">
      <Sidebar active="catalog" />

      <section className="workspace">
        <header className="pageHeader">
          <div>
            <p className="kicker">แคตตาล็อกวันนี้</p>
            <h1>สร้างภาพสำหรับส่งลูกค้า</h1>
            <span className="muted">{getTodayLabel()}</span>
          </div>
          <Link href="/catalog" className="button darkButton">
            ดูหน้าลูกค้า
          </Link>
        </header>

        <div className="builderGrid">
          <section className="catalogCanvas surface">
            <div ref={posterRef}>
              <CatalogPoster products={todayProducts} selection={selection} />
            </div>
            <div className="builderActions">
              <button className="button darkButton" onClick={downloadCatalogImage} disabled={isDownloading}>
                <Download size={17} />
                {isDownloading ? 'กำลังดาวน์โหลด' : 'ดาวน์โหลดรูปภาพ'}
              </button>
              <button className="button greenButton" onClick={copyLink}>
                <Link2 size={17} />
                {copied === 'ลิงก์' ? 'คัดลอกลิงก์แล้ว' : 'แชร์ลิงก์'}
              </button>
              <button className="button subtleButton" onClick={printCatalog}>
                <Printer size={17} />
                พิมพ์ / PDF
              </button>
            </div>
          </section>

          <aside className="surface builderPanel">
            <h2>ส่งให้ลูกค้า</h2>
            <div className="sendPanel">
              <button className="button greenButton" onClick={() => copyCustomerMessage('LINE OA')}>
                <MessageCircle size={17} />
                {copied === 'LINE OA' ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ LINE OA'}
              </button>
              <a className="button subtleButton" href={lineUrl} target="_blank" rel="noreferrer">
                <Send size={17} />
                เปิด LINE OA
              </a>
              <button className="button darkButton" onClick={() => copyCustomerMessage('Facebook Inbox')}>
                <MessagesSquare size={17} />
                {copied === 'Facebook Inbox' ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ Inbox'}
              </button>
              <a className="button subtleButton" href={facebookUrl} target="_blank" rel="noreferrer">
                <Send size={17} />
                เปิด Facebook Inbox
              </a>
            </div>
            <p className="automationNote">
              ข้อความด้านบนแก้ได้ที่เมนู “ตั้งค่าข้อความ” ส่วน auto-reply จริงต้องต่อ LINE Messaging API และ Meta Messenger Webhook เพิ่ม
            </p>

            <h2>รูปแบบ</h2>
            <div className="templateGrid">
              <button className="templateCard active">A</button>
              <button className="templateCard">B</button>
              <button className="templateCard">C</button>
            </div>
            <h2>สีธีม</h2>
            <div className="swatches">
              <span style={{ background: '#6b3a0b' }} />
              <span style={{ background: '#d9a441' }} />
              <span style={{ background: '#16825f' }} />
              <span style={{ background: '#111827' }} />
            </div>
            <h2>ตัวเลือกที่แสดง</h2>
            <label className="tickLine"><input type="checkbox" defaultChecked /> แสดงราคา</label>
            <label className="tickLine"><input type="checkbox" defaultChecked /> แสดงจำนวนคงเหลือ</label>
            <label className="tickLine"><input type="checkbox" defaultChecked /> แสดงวันที่</label>
            <label className="tickLine"><input type="checkbox" defaultChecked /> แสดงไอคอนร้าน</label>
          </aside>
        </div>
      </section>
    </main>
  )
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolve) => {
        image.onload = () => resolve()
        image.onerror = () => resolve()
      })
    })
  )
}

async function embedImagesForDownload(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'))
  const originals = images.map((image) => ({ image, src: image.src }))

  await Promise.all(
    images.map(async (image) => {
      if (!image.src || image.src.startsWith('data:') || image.src.startsWith('blob:')) return

      try {
        const response = await fetch(image.src, { cache: 'no-store', mode: 'cors' })
        if (!response.ok) return
        const blob = await response.blob()
        const dataUrl = await blobToDataUrl(blob)
        image.src = dataUrl
      } catch {
        // keep original image when browser blocks conversion
      }
    })
  )

  await waitForImages(root)

  return () => {
    originals.forEach(({ image, src }) => {
      image.src = src
    })
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
