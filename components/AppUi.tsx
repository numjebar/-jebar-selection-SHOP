'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, ClipboardList, LayoutDashboard, LogOut, Package, Settings, ShoppingBag, Users } from 'lucide-react'
import { formatBaht } from '../lib/catalogData'
import { useTodayLabel } from '../lib/useTodayLabel'

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <img className={compact ? 'brandLogo compact' : 'brandLogo'} src="/jebar-logo.png" alt="JE BAR" />
}

export function Sidebar({ active }: { active: string }) {
  const router = useRouter()
  const items = [
    { id: 'dashboard', href: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'products', href: '/admin/products', label: 'สินค้า', icon: Package },
    { id: 'selection', href: '/admin/selection', label: 'สินค้าวันนี้', icon: ClipboardList },
    { id: 'catalog', href: '/admin/catalog', label: 'แคตตาล็อก', icon: ShoppingBag },
    { id: 'orders', href: '/catalog', label: 'หน้าลูกค้า', icon: Users },
    {
      id: 'analytics',
      href: '/admin/analytics',
      label: 'KPI / Analytics',
      icon: BarChart3
    },
    { id: 'settings', href: '/admin/settings', label: 'ตั้งค่าข้อความ', icon: Settings }
  ]

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <aside className="appSidebar">
      <div className="brandBlock">
        <div className="brandLogoPlate">
          <BrandLogo compact />
        </div>
        <div>
          <strong>JE BAR</strong>
          <span>Bakery & Home</span>
        </div>
      </div>

      <nav className="sideNav">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              className={active === item.id ? 'active' : ''}
              href={item.href}
              key={item.id}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <button className="logoutButton" onClick={logout}>
        <LogOut size={17} />
        ออกจากระบบ
      </button>
    </aside>
  )
}

export function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <article className="metricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{suffix}</small>
    </article>
  )
}

export function ProductThumb({ productName, imageUrl }: { productName: string; imageUrl: string }) {
  return (
    <div className="miniThumb">
      {imageUrl ? <img src={imageUrl} alt={productName} crossOrigin="anonymous" loading="lazy" /> : <span>{productName.slice(0, 2)}</span>}
    </div>
  )
}

export function CatalogPoster({
  products,
  selection
}: {
  products: { id: string; nameTh: string; price: number; imageUrl: string }[]
  selection: Record<string, { quantity: number; isAvailable: boolean }>
}) {
  const todayLabel = useTodayLabel()

  return (
    <div className="posterPreview">
      <div className="posterBrand">
        <BrandLogo compact />
      </div>
      <h3>ขนมในตู้วันนี้</h3>
      <p>{todayLabel}</p>
      <div className="posterGrid">
        {products.map((product) => (
          <div className="posterProduct" key={product.id}>
            <ProductThumb productName={product.nameTh} imageUrl={product.imageUrl} />
            <strong>{product.nameTh}</strong>
            <span>{formatBaht(product.price)}</span>
            <small>เหลือ {selection[product.id]?.quantity || 0} ชิ้น</small>
          </div>
        ))}
      </div>
    </div>
  )
}
