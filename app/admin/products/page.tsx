'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { LayoutGrid, List, Plus, Search, Tags } from 'lucide-react'
import { ProductThumb, Sidebar } from '../../../components/AppUi'
import { Product, formatBaht, getCategoryLabel, makeProductId } from '../../../lib/catalogData'
import { resizeImageForStorage, useCatalogStore } from '../../../lib/useCatalogStore'

const blankProduct = {
  nameTh: '',
  nameEn: '',
  category: '',
  price: 0,
  description: '',
  promotion: ''
}

type ProductViewMode = 'cards' | 'compact'

export default function ProductsAdminPage() {
  const { products, categories, setProducts, updateProduct, warning } = useCatalogStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<ProductViewMode>('compact')
  const [form, setForm] = useState(blankProduct)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.nameTh, product.nameEn, product.description].join(' ').toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'ALL' || product.category === category
      return matchesQuery && matchesCategory
    })
  }, [category, products, query])

  function addProduct() {
    const nameTh = form.nameTh.trim()
    if (!nameTh) return

    const product: Product = {
      id: makeProductId(nameTh),
      nameTh,
      nameEn: form.nameEn.trim(),
      category: form.category || categories[0]?.code || 'OTHERS',
      price: Number(form.price) || 0,
      description: form.description.trim(),
      promotion: form.promotion.trim(),
      imageUrl: '',
      isActive: true,
      isFavorite: false
    }

    setProducts((current) => [product, ...current])
    setForm(blankProduct)
    setShowForm(false)
  }

  function removeProduct(id: string) {
    setProducts((current) => current.filter((product) => product.id !== id))
  }

  async function handleImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = await resizeImageForStorage(file)
    updateProduct(id, { imageUrl })
  }

  return (
    <main className="appFrame">
      <Sidebar active="products" />

      <section className="workspace">
        <header className="pageHeader">
          <div>
            <p className="kicker">จัดการสินค้า</p>
            <h1>คลังสินค้า</h1>
          </div>
          <button className="button darkButton" onClick={() => setShowForm((value) => !value)}>
            <Plus size={17} />
            เพิ่มสินค้า
          </button>
        </header>

        <div className="toolbar">
          <label className="searchBox">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาสินค้า..." />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">ทุกหมวดหมู่</option>
            {categories.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
          <a className="button subtleButton" href="/admin/settings">
            <Tags size={17} />
            หมวดหมู่
          </a>
          <div className="viewSwitcher" aria-label="เลือกมุมมองสินค้า">
            <button className={viewMode === 'compact' ? 'active' : ''} onClick={() => setViewMode('compact')} type="button">
              <List size={17} />
              รายการ
            </button>
            <button className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')} type="button">
              <LayoutGrid size={17} />
              การ์ด
            </button>
          </div>
        </div>

        {warning ? <p className="warningBox">{warning}</p> : null}

        {showForm ? (
          <section className="surface addPanel">
            <div className="formGrid">
              <input className="input" value={form.nameTh} onChange={(event) => setForm({ ...form, nameTh: event.target.value })} placeholder="ชื่อสินค้า" />
              <input className="input" value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder="ชื่ออังกฤษ" />
              <select className="input" value={form.category || categories[0]?.code || ''} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input className="input" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} placeholder="ราคา" />
              <textarea className="input wide" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="รายละเอียดสินค้า" />
            </div>
            <button className="button darkButton" onClick={addProduct}>
              บันทึกสินค้า
            </button>
          </section>
        ) : null}

        <section className={`productStudioGrid ${viewMode === 'compact' ? 'compactProducts' : 'cardProducts'}`}>
          {filteredProducts.map((product) => (
            <article className="studioProductCard" key={product.id}>
              <div className="studioImage">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.nameTh} /> : <ProductThumb productName={product.nameTh} imageUrl="" />}
                <label className="imageUpload">
                  เปลี่ยนรูป
                  <input type="file" accept="image/*" onChange={(event) => handleImage(product.id, event)} />
                </label>
              </div>

              <div className="studioProductBody">
                <input className="plainInput productNameInput" value={product.nameTh} onChange={(event) => updateProduct(product.id, { nameTh: event.target.value })} />
                <input
                  aria-label={`ราคาของ ${product.nameTh}`}
                  className="plainInput priceInput"
                  inputMode="numeric"
                  min="0"
                  type="number"
                  value={product.price}
                  onChange={(event) => updateProduct(product.id, { price: Number(event.target.value) || 0 })}
                />
                <textarea className="plainInput" value={product.description} onChange={(event) => updateProduct(product.id, { description: event.target.value })} />
                <select className="plainInput" value={product.category} onChange={(event) => updateProduct(product.id, { category: event.target.value })}>
                  {categories.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="cardFooter">
                  <span>{getCategoryLabel(product.category, categories)}</span>
                  <button
                    aria-pressed={product.isActive}
                    className={product.isActive ? 'saleSwitch isOn' : 'saleSwitch'}
                    onClick={() => updateProduct(product.id, { isActive: !product.isActive })}
                  >
                    <span className="switchTrack">
                      <span className="switchKnob" />
                    </span>
                    <b>{product.isActive ? 'เปิดขาย' : 'ปิดขาย'}</b>
                  </button>
                  <button className="dangerText" onClick={() => removeProduct(product.id)}>
                    ลบ
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
