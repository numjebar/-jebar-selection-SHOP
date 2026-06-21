'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardCopy, Menu } from 'lucide-react'
import { BrandLogo, ProductThumb } from '../../components/AppUi'
import { trackCatalogEvent } from '../../lib/analytics'
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

  useEffect(() => {
    trackCatalogEvent('Catalog Viewed')
  }, [])

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
    const currentQuantity = cart[id] || 0
    const nextQuantity = Math.max(0, Math.min(quantity, max))
    if (nextQuantity === currentQuantity) return

    const product = products.find((item) => item.id === id)
    trackCatalogEvent(nextQuantity > currentQuantity ? 'Cart Item Added' : 'Cart Item Removed', {
      productId: id,
      productName: product?.nameTh || id,
      quantity: nextQuantity
    })
    setCart((current) => ({ ...current, [id]: nextQuantity }))
  }

  function startCatalog() {
    trackCatalogEvent('Catalog Started', { productCount: todayProducts.length })
    setHasStarted(true)
  }

  async function copyOrder() {
    await navigator.clipboard.writeText(orderText)
    trackCatalogEvent('Order Copied', { itemCount: totalQuantity, totalValue: totalPrice })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const summaryBox = (
    <section className="surface compactOrderSummary">
      <h2>สรุปการจอง</h2>
      {selectedProducts.length === 0 ? (
        <p className="muted">ยังไม่ได้เลือกรายการ</p>
      ) : (
        <div className="orderSummaryList compact">
          {selectedProducts.map((product) => {
            const quantity = cart[product.id] || 0
            const lineTotal = product.price * quantity
            return (
              <div className="orderSummaryItem compact" key={product.id}>
                <span>{product.nameTh}</span>
                <b>x{quantity}</b>
                <strong>{formatBaht(lineTotal)}</strong>
              </div>
            )
          })}
        </div>
      )}
      <div className="orderSummaryTotal compact">
        <span>รวม {totalQuantity} ชิ้น</span>
        <strong>{formatBaht(totalPrice)}</strong>
      </div>
    </section>
  )

  return (
    <main className="customerPage compactCustomerPage">
      <section className="phoneFrame compactPhoneFrame">
        <header className="phoneHeader compactPhoneHeader">
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
            <button className="button goldButton fullWidth" onClick={startCatalog}>
              ดูรายการขนม
            </button>
          </section>
        ) : (
          <>
            <div className="customerHero compactCustomerHero">
              <h1>ขนมในตู้วันนี้</h1>
              <p>{getTodayLabel()}</p>
            </div>

            <section className="customerList compactCustomerList">
              {todayProducts.map((product) => {
                const max = selection[product.id]?.quantity || 0
                const quantity = cart[product.id] || 0

                return (
                  <article className="customerItem compactCustomerItem" key={product.id}>
                    <ProductThumb productName={product.nameTh} imageUrl={product.imageUrl} />
                    <div className="customerItemInfo">
                      <strong>{product.nameTh}</strong>
                      <span>{formatBaht(product.price)} <small>เหลือ {max} ชิ้น</small></span>
                    </div>
                    <div className="miniStepper compactMiniStepper">
                      <button onClick={() => updateCart(product.id, quantity - 1, max)} disabled={quantity === 0}>-</button>
                      <b>{quantity}</b>
                      <button onClick={() => updateCart(product.id, quantity + 1, max)} disabled={quantity >= max}>+</button>
                    </div>
                  </article>
                )
              })}
            </section>

            <footer className="customerFooter compactCustomerFooter">
              <button className="button greenButton fullWidth" onClick={copyOrder} disabled={selectedProducts.length === 0}>
                <ClipboardCopy size={17} />
                {copied ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความสั่งซื้อ'}
              </button>
              {summaryBox}
              {copied ? (
                <p className="customerHint copiedHint">
                  คัดลอกข้อความแล้วค่ะ ส่งใน LINE OA หรือ Facebook Inbox แล้วรอร้านยืนยันนะคะ
                </p>
              ) : (
                <p className="customerHint compactHint">
                  กดคัดลอก แล้วนำข้อความไปวางส่งให้ร้านใน LINE OA หรือ Facebook Inbox ค่ะ
                </p>
              )}
            </footer>
          </>
        )}
      </section>

      <aside className="customerNotes compactCustomerNotes">
        <section className="surface compactHowTo">
          <h2>วิธีจอง</h2>
          <ul>
            <li>เลือกจำนวนที่ต้องการ</li>
            <li>กดคัดลอกข้อความสั่งซื้อ</li>
            <li>วางส่งใน LINE OA หรือ Facebook Inbox</li>
            <li>รอร้านตรวจสอบและยืนยันรายการ</li>
          </ul>
        </section>
      </aside>
    </main>
  )
}
