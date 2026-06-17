'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Save } from 'lucide-react'
import { ProductThumb, Sidebar } from '../../../components/AppUi'
import { formatBaht, getCategoryLabel, getTodayLabel, getTotalQuantity } from '../../../lib/catalogData'
import { useCatalogStore } from '../../../lib/useCatalogStore'

type ViewMode = 'all' | 'selected' | 'category'

export default function SelectionPage() {
  const { products, selection, categories, updateSelection, savedAt } = useCatalogStore()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [activeCategory, setActiveCategory] = useState('')
  const selectedCategory = categories.some((category) => category.code === activeCategory) ? activeCategory : categories[0]?.code || ''
  const totalSelected = products.filter((product) => selection[product.id]?.isAvailable).length
  const totalQuantity = getTotalQuantity(products, selection)

  const visibleProducts = products.filter((product) => {
    if (viewMode === 'selected') return selection[product.id]?.isAvailable
    if (viewMode === 'category') return product.category === selectedCategory
    return true
  })

  return (
    <main className="appFrame">
      <Sidebar active="selection" />

      <section className="workspace">
        <header className="pageHeader">
          <div>
            <p className="kicker">สินค้าวันนี้</p>
            <h1>เลือกสินค้าพร้อมขาย</h1>
            <span className="muted">{getTodayLabel()}</span>
          </div>
          <Link href="/admin/catalog" className="button goldButton">
            <Save size={17} />
            สร้างแคตตาล็อก
          </Link>
        </header>

        <section className="selectionTabs">
          <button className={viewMode === 'all' ? 'active' : ''} onClick={() => setViewMode('all')}>
            ทั้งหมด ({products.length})
          </button>
          <button className={viewMode === 'selected' ? 'active' : ''} onClick={() => setViewMode('selected')}>
            ที่เลือก ({totalSelected})
          </button>
          <button className={viewMode === 'category' ? 'active' : ''} onClick={() => setViewMode('category')}>
            หมวดหมู่
          </button>
        </section>

        {viewMode === 'category' ? (
          <section className="categoryFilter">
            {categories.map((category) => (
              <button
                className={selectedCategory === category.code ? 'active' : ''}
                key={category.code}
                onClick={() => setActiveCategory(category.code)}
              >
                {category.label}
              </button>
            ))}
          </section>
        ) : null}

        <section className="selectionGrid">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((product) => {
              const item = selection[product.id] || { quantity: 0, isAvailable: false }
              return (
                <article className={item.isAvailable ? 'selectionRow selected' : 'selectionRow'} key={product.id}>
                  <label className="checkCell">
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      onChange={(event) => updateSelection(product.id, { isAvailable: event.target.checked })}
                    />
                  </label>
                  <ProductThumb productName={product.nameTh} imageUrl={product.imageUrl} />
                  <div>
                    <strong>{product.nameTh}</strong>
                    <span>{formatBaht(product.price)}</span>
                    <small>{getCategoryLabel(product.category, categories)}</small>
                  </div>
                  <div className="qtyControl">
                    <small>เหลือ (ชิ้น)</small>
                    <div>
                      <button onClick={() => updateSelection(product.id, { quantity: Math.max(0, item.quantity - 1) })}>-</button>
                      <input
                        value={item.quantity}
                        type="number"
                        min="0"
                        onChange={(event) => updateSelection(product.id, { quantity: Number(event.target.value) || 0 })}
                      />
                      <button onClick={() => updateSelection(product.id, { quantity: item.quantity + 1 })}>+</button>
                    </div>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="emptyState surface">
              <h2>ยังไม่มีสินค้าในมุมมองนี้</h2>
              <p>ลองเปลี่ยนตัวกรอง หรือกลับไปเลือกจากรายการทั้งหมด</p>
            </div>
          )}
        </section>

        <footer className="selectionFooter">
          <strong>เลือกแล้ว {totalSelected} รายการ</strong>
          <span>รวมทั้งหมด {totalQuantity} ชิ้น</span>
          <small>บันทึกล่าสุด {savedAt || '-'}</small>
        </footer>
      </section>
    </main>
  )
}
