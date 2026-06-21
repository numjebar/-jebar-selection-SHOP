'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Download, Link2, MessageCircle, MessagesSquare, Printer, Send } from 'lucide-react'
import { CatalogPoster, Sidebar } from '../../../components/AppUi'
import { Product, SelectionMap, formatBaht, getAvailableProducts, getTodayLabel } from '../../../lib/catalogData'
import { useCatalogStore } from '../../../lib/useCatalogStore'

export default function CatalogBuilderPage() {
  const { products, selection, messages } = useCatalogStore()
  const todayProducts = getAvailableProducts(products, selection)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [mobileImageUrl, setMobileImageUrl] = useState('')
  const [copied, setCopied] = useState('')
  const [customerUrl, setCustomerUrl] = useState('/catalog')

  useEffect(() => {
    setCustomerUrl(`${window.location.origin}/catalog`)
  }, [])
  const lineUrl = process.env.NEXT_PUBLIC_LINE_OA_URL || process.env.NEXT_PUBLIC_LINE_URL || 'https://lin.ee/t8QoAix'
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_INBOX_URL || process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/102339796492016'

  function printCatalog() {
    window.print()
  }

  async function migrateOldImages() {
    setIsMigrating(true)

    try {
      const response = await fetch('/api/migrate-images', { method: 'POST' })
      const data = (await response.json().catch(() => ({}))) as { migrated?: number; failed?: number; error?: string }
      if (!response.ok) throw new Error(data.error || 'Migration failed')
      alert(`ย้ายรูปเก่าเข้า Supabase Storage แล้ว ${data.migrated || 0} รูป${data.failed ? ` / ไม่สำเร็จ ${data.failed} รูป` : ''}`)
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'ย้ายรูปเก่าไม่สำเร็จ')
    } finally {
      setIsMigrating(false)
    }
  }

  async function downloadCatalogImage() {
    setIsDownloading(true)

    try {
      const dataUrl = await renderCatalogCanvas(todayProducts, selection)
      const blob = dataUrlToBlob(dataUrl)
      const objectUrl = URL.createObjectURL(blob)

      if (mobileImageUrl) URL.revokeObjectURL(mobileImageUrl)
      setMobileImageUrl(objectUrl)

      const link = document.createElement('a')
      link.download = `je-bar-catalog-${new Date().toISOString().slice(0, 10)}.png`
      link.href = objectUrl
      document.body.appendChild(link)
      link.click()
      link.remove()
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
            <CatalogPoster products={todayProducts} selection={selection} />
            <div className="builderActions">
              <button className="button darkButton" onClick={downloadCatalogImage} disabled={isDownloading}>
                <Download size={17} />
                {isDownloading ? 'กำลังสร้างรูป...' : 'ดาวน์โหลดรูปภาพ'}
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
            {mobileImageUrl ? (
              <div className="mobileSaveBox">
                <p>ถ้ามือถือไม่เซฟอัตโนมัติ ให้กดปุ่มนี้แล้วแตะค้างที่รูปเพื่อ Save Image</p>
                <a className="button subtleButton fullWidth" href={mobileImageUrl} target="_blank" rel="noreferrer">
                  เปิดรูปสำหรับเซฟในมือถือ
                </a>
              </div>
            ) : null}
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

            <h2>จัดการรูป</h2>
            <button className="button subtleButton fullWidth" onClick={migrateOldImages} disabled={isMigrating}>
              {isMigrating ? 'กำลังย้ายรูป...' : 'ย้ายรูปเก่าเข้า Supabase Storage'}
            </button>

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

async function renderCatalogCanvas(products: Product[], selection: SelectionMap) {
  const width = 1800
  const columns = 3
  const gapX = 42
  const gapY = 26
  const paddingX = 86
  const headerHeight = 230
  const cardWidth = (width - paddingX * 2 - gapX * (columns - 1)) / columns
  const imageSize = 365
  const nameY = imageSize + 50
  const priceY = imageSize + 138
  const stockY = imageSize + 178
  const cardHeight = 585
  const rows = Math.max(1, Math.ceil(products.length / columns))
  const height = headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gapY + 70

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot create canvas')

  ctx.fillStyle = '#f2dfbf'
  ctx.fillRect(0, 0, width, height)
  drawRoundedRect(ctx, 26, 26, width - 52, height - 52, 28, '#f2dfbf', '#e7cfa9')

  ctx.textAlign = 'center'
  ctx.fillStyle = '#3b3229'
  ctx.font = '700 66px Georgia, serif'
  ctx.fillText('J E B A R', width / 2, 90)

  ctx.fillStyle = '#181512'
  ctx.font = '900 76px sans-serif'
  ctx.fillText('ขนมในตู้วันนี้', width / 2, 166)

  ctx.font = '400 38px sans-serif'
  ctx.fillText(getTodayLabel(), width / 2, 214)

  const loadedImages = await Promise.all(products.map((product) => loadCatalogImage(product.imageUrl)))

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index]
    const row = Math.floor(index / columns)
    const col = index % columns
    const x = paddingX + col * (cardWidth + gapX)
    const y = headerHeight + row * (cardHeight + gapY)
    const image = loadedImages[index]
    const imageX = x + (cardWidth - imageSize) / 2
    const imageY = y

    if (image) {
      drawRoundedImage(ctx, image, imageX, imageY, imageSize, imageSize, 26)
    } else {
      drawRoundedRect(ctx, imageX, imageY, imageSize, imageSize, 26, '#ead6b8')
      ctx.fillStyle = '#6b3a0b'
      ctx.font = '900 58px sans-serif'
      ctx.fillText(product.nameTh.slice(0, 2), x + cardWidth / 2, imageY + 200)
    }

    ctx.fillStyle = '#181512'
    ctx.font = '900 39px sans-serif'
    drawCenteredWrappedText(ctx, product.nameTh, x + cardWidth / 2, y + nameY, cardWidth - 24, 46, 2)

    ctx.font = '400 34px sans-serif'
    ctx.fillText(formatBaht(product.price), x + cardWidth / 2, y + priceY)

    ctx.font = '400 31px sans-serif'
    ctx.fillText(`เหลือ ${selection[product.id]?.quantity || 0} ชิ้น`, x + cardWidth / 2, y + stockY)
  }

  return canvas.toDataURL('image/png', 0.95)
}

async function loadCatalogImage(src: string) {
  if (!src) return null

  let imageSrc = src
  if (!src.startsWith('data:')) {
    const response = await fetch('/api/image-data-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: src })
    }).catch(() => null)
    if (response?.ok) {
      const data = (await response.json().catch(() => ({}))) as { dataUrl?: string }
      if (data.dataUrl) imageSrc = data.dataUrl
    }
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = imageSrc
  })
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(',')
  const contentType = header.match(/data:(.*?);base64/)?.[1] || 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: contentType })
}

function drawCenteredWrappedText(ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)

  lines.slice(0, maxLines).forEach((item, index) => {
    ctx.fillText(item, centerX, y + index * lineHeight)
  })
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke?: string) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

function drawRoundedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, radius: number) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.clip()

  const sourceRatio = image.width / image.height
  const targetRatio = width / height
  let sx = 0
  let sy = 0
  let sw = image.width
  let sh = image.height

  if (sourceRatio > targetRatio) {
    sw = image.height * targetRatio
    sx = (image.width - sw) / 2
  } else {
    sh = image.width / targetRatio
    sy = (image.height - sh) / 2
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height)
  ctx.restore()
}
