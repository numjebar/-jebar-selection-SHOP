'use client'

import { useMemo, useState } from 'react'
import { ClipboardCopy, Menu } from 'lucide-react'
import { BrandLogo, ProductThumb } from '../../components/AppUi'
import { formatBaht, getAvailableProducts, getTodayLabel } from '../../lib/catalogData'
import { useCatalogStore } from '../../lib/useCatalogStore'

type Cart = Record<string, number>

export default function CatalogPage() {
  const { products, selection, messages } = useCatalogStore()
  const [hasStarted, setHasStarted] = useState(false)
  const [cart, setCart] = useState<Cart>({})
  const [copied, setCopied] = useState(false)
  const todayProducts = getAvailableProducts(products, selection)
  const selectedProducts = todayProducts.filter((product) => (cart[product.id] || 0) > 0)
  const totalQuantity = selectedProducts.reduce((sum, product) => sum + (cart[product.id] || 0), 0)
  const totalPrice = selectedProducts.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0)

  const orderText = useMemo(() => {
    return [
      'รายการที่สั่ง',
      getTodayLabel(),
      '',
      ...selectedProducts.map((product) => `- ${product.nameTh} x${cart[product.id]} = ${formatBaht(product.price * cart[product.id])}`),
      '',
      `รวม ${totalQuantity} ชิ้น`,
      `ยอดรวม ${formatBaht(totalPrice)}`
    ].join('\n')
  }, [cart, selectedProducts, totalPrice, totalQuantity])

  function updateCart(id: string, quantity: number, max: number) {
    setCart((current) => ({ ...current, [id]: Math.max(0, Math.min(quantity, max)) }))
  }

  async function copyOrder() {
    await navigator.clipboard.writeText(orderText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="customerPage">
      <section className="phoneFrame">
        <header className="phoneHeader">
          <div>
            <BrandLogo compact />
            <span>Bakery & Home</span>
          </div>
          <Menu size={22} />
        </header>

        {!hasStarted ? (
          <section className="welcomeScreen">
            <p className="kicker">ยินดีต้อนรับ</p>
            <h1>ขนมในตู้วันนี้</h1>
            <p>{messages.welcomeMessage}</p>
            <div className="welcomeStats">
              <div>
                <strong>{todayProducts.length}</strong>
                <span>เมนูวันนี้</span>
              </div>
              <div>
                <strong>{getTodayLabel()}</strong>
                <span>อัปเดตล่าสุด</span>
              </div>
            </div>
            <button className="button goldButton fullWidth" onClick={() => setHasStarted(true)}>
              ดูรายการขนม
            </button>
          </section>
        ) : (
          <>
            <div className="customerHero">
              <h1>ขนมในตู้วันนี้</h1>
              <p>{getTodayLabel()}</p>
              <div className="orderSteps">
                <div><b>1</b><span>เลือกจำนวน</span></div>
                <div><b>2</b><span>กดคัดลอกข้อความ</span></div>
                <div><b>3</b><span>วางส่งใน LINE OA หรือ Inbox</span></div>
              </div>
            </div>

            <section className="customerList">
              {todayProducts.map((product) => {
                const max = selection[product.id]?.quantity || 0
                const quantity = cart[product.id] || 0

                return (
                  <article className="customerItem" key={product.id}>
                    <ProductThumb productName={product.nameTh} imageUrl={product.imageUrl} />
                    <div>
                      <strong>{product.nameTh}</strong>
                      <span>{formatBaht(product.price)}</span>
                      <small>เหลือ {max} ชิ้น</small>
                    </div>
                    <div className="miniStepper">
                      <button onClick={() => updateCart(product.id, quantity - 1, max)} disabled={quantity === 0}>-</button>
                      <b>{quantity}</b>
                      <button onClick={() => updateCart(product.id, quantity + 1, max)} disabled={quantity >= max}>+</button>
                    </div>
                  </article>
                )
              })}
            </section>

            <footer className="customerFooter">
              <button className="button greenButton fullWidth" onClick={copyOrder} disabled={selectedProducts.length === 0}>
                <ClipboardCopy size={17} />
                {copied ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความสั่งซื้อ'}
              </button>
              {copied ? (
                <p className="customerHint copiedHint">
                  คัดลอกข้อความแล้วค่ะ เมื่อลูกค้าส่งข้อความแล้ว รอทางร้านคอนเฟิร์มออเดอร์อีกทีนะคะ
                </p>
              ) : (
                <p className="customerHint">
                  กดคัดลอกก่อน แล้วนำข้อความไปวางส่งให้ร้านใน LINE OA หรือ Facebook Inbox เพื่อให้ร้านตรวจสอบและยืนยันรายการค่ะ
                </p>
              )}
            </footer>
          </>
        )}
      </section>

      <aside className="customerNotes">
        <section className="surface">
          <h2>วิธีจอง</h2>
          <ul>
            <li>กดดูรายการขนม</li>
            <li>เลือกจำนวนที่ต้องการ</li>
            <li>กดคัดลอกข้อความสั่งซื้อ</li>
            <li>เปิด LINE OA หรือ Facebook Inbox</li>
            <li>วางข้อความแล้วส่งกลับมาให้ร้านยืนยัน</li>
          </ul>
        </section>
        <section className="surface">
          <h2>สรุปการจอง</h2>
          <p>เลือกแล้ว {totalQuantity} ชิ้น</p>
          <strong>{formatBaht(totalPrice)}</strong>
        </section>
      </aside>
    </main>
  )
}
